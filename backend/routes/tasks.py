"""Task routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, case, update
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional, List

from database import get_db
from models import User, Task, Tag, task_tags
from schemas import TaskCreate, TaskUpdate, TaskResponse, TaskStatusEnum, TaskPriorityEnum, TaskReorder
from auth import get_current_user
from helpers import sanitize_search, log_activity

router = APIRouter()

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    response: Response,
    search: Optional[str] = Query(None),
    status: Optional[TaskStatusEnum] = Query(None),
    priority: Optional[TaskPriorityEnum] = Query(None),
    tag_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tasks for current user with optional filters."""
    query = select(Task).options(selectinload(Task.tags)).where(Task.user_id == current_user.id)
    
    if search:
        safe = sanitize_search(search)
        query = query.where(
            or_(
                Task.title.ilike(f"%{safe}%"),
                Task.description.ilike(f"%{safe}%")
            )
        )
    if status:
        query = query.where(Task.status == status.value)
    if priority:
        query = query.where(Task.priority == priority.value)
    if tag_id:
        query = query.join(task_tags).where(task_tags.c.tag_id == tag_id)
    
    # Total count for pagination
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    response.headers["X-Total-Count"] = str(count_result.scalar() or 0)
    
    query = query.order_by(Task.position, Task.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new task."""
    result = await db.execute(
        select(func.max(Task.position)).where(Task.user_id == current_user.id)
    )
    max_pos = result.scalar() or 0
    
    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        status=task_data.status.value,
        priority=task_data.priority.value,
        due_date=task_data.due_date,
        position=max_pos + 1
    )
    db.add(task)
    await db.flush()
    
    if task_data.tag_ids:
        for tag_id in task_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                task.tags.append(tag)
    
    await db.commit()
    
    result = await db.execute(
        select(Task).options(selectinload(Task.tags)).where(Task.id == task.id)
    )
    task = result.scalar_one()
    
    await log_activity(db, current_user.id, "created", "task", task.id, task.title)
    
    return task

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific task."""
    result = await db.execute(
        select(Task).options(selectinload(Task.tags)).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a task."""
    result = await db.execute(
        select(Task).options(selectinload(Task.tags)).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = task.status
    
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.status is not None:
        task.status = task_data.status.value
    if task_data.priority is not None:
        task.priority = task_data.priority.value
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
    if task_data.position is not None:
        task.position = task_data.position
    
    if task_data.tag_ids is not None:
        task.tags.clear()
        for tag_id in task_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                task.tags.append(tag)
    
    task.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    
    if old_status != task.status and task.status == "completed":
        await log_activity(db, current_user.id, "completed", "task", task.id, task.title)
    else:
        await log_activity(db, current_user.id, "updated", "task", task.id, task.title)
    
    return task

@router.post("/tasks/reorder")
async def reorder_tasks(
    reorder_data: TaskReorder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reorder tasks by updating their positions."""
    if reorder_data.task_ids:
        whens = {tid: idx for idx, tid in enumerate(reorder_data.task_ids)}
        stmt = (
            update(Task)
            .where(Task.id.in_(reorder_data.task_ids), Task.user_id == current_user.id)
            .values(position=case(whens, value=Task.id))
        )
        await db.execute(stmt)
    
    await db.commit()
    return {"message": "Tasks reordered successfully"}

@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_title = task.title
    await db.delete(task)
    await db.commit()
    
    await log_activity(db, current_user.id, "deleted", "task", task_id, task_title)
