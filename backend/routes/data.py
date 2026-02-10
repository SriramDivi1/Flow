"""Activity, analytics, export, and dashboard routes."""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import json
import csv
import io

from database import get_db
from models import User, Task, Note, Post, Tag, Activity
from schemas import ActivityResponse, AnalyticsResponse, ExportRequest
from auth import get_current_user

router = APIRouter()

# ==================== ACTIVITY TIMELINE ====================

@router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    limit: int = Query(50, le=100),
    entity_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get activity timeline for current user."""
    query = select(Activity).where(Activity.user_id == current_user.id)
    
    if entity_type:
        query = query.where(Activity.entity_type == entity_type)
    
    query = query.order_by(Activity.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

# ==================== ANALYTICS ====================

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    days: int = Query(30, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics data for current user."""
    cutoff = min(days, 14)
    start_date = datetime.now(timezone.utc) - timedelta(days=cutoff)
    
    # Tasks by status (1 query)
    result = await db.execute(
        select(Task.status, func.count(Task.id))
        .where(Task.user_id == current_user.id)
        .group_by(Task.status)
    )
    tasks_by_status = {r[0]: r[1] for r in result.all()}
    
    # Tasks by priority (1 query)
    result = await db.execute(
        select(Task.priority, func.count(Task.id))
        .where(Task.user_id == current_user.id)
        .group_by(Task.priority)
    )
    tasks_by_priority = {r[0]: r[1] for r in result.all()}
    
    # Notes by color (1 query)
    result = await db.execute(
        select(Note.color, func.count(Note.id))
        .where(Note.user_id == current_user.id)
        .group_by(Note.color)
    )
    notes_by_color = {r[0]: r[1] for r in result.all() if r[1] > 0}
    
    # Tasks completed over time (1 query)
    result = await db.execute(
        select(func.date(Activity.created_at), func.count(Activity.id))
        .where(
            Activity.user_id == current_user.id,
            Activity.entity_type == "task",
            Activity.action == "completed",
            Activity.created_at >= start_date
        )
        .group_by(func.date(Activity.created_at))
    )
    completed_map = {str(r[0]): r[1] for r in result.all()}
    tasks_completed_over_time = []
    for i in range(cutoff - 1, -1, -1):
        date = (datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat()
        tasks_completed_over_time.append({"date": date, "count": completed_map.get(date, 0)})
    
    # Posts published over time (1 query)
    result = await db.execute(
        select(func.date(Activity.created_at), func.count(Activity.id))
        .where(
            Activity.user_id == current_user.id,
            Activity.entity_type == "post",
            Activity.action == "published",
            Activity.created_at >= start_date
        )
        .group_by(func.date(Activity.created_at))
    )
    published_map = {str(r[0]): r[1] for r in result.all()}
    posts_published_over_time = []
    for i in range(cutoff - 1, -1, -1):
        date = (datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat()
        posts_published_over_time.append({"date": date, "count": published_map.get(date, 0)})
    
    # Activity over time (1 query)
    result = await db.execute(
        select(func.date(Activity.created_at), func.count(Activity.id))
        .where(
            Activity.user_id == current_user.id,
            Activity.created_at >= start_date
        )
        .group_by(func.date(Activity.created_at))
    )
    activity_map = {str(r[0]): r[1] for r in result.all()}
    activity_over_time = []
    for i in range(cutoff - 1, -1, -1):
        date = (datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat()
        activity_over_time.append({"date": date, "count": activity_map.get(date, 0)})
    
    # Productivity score
    total_tasks = sum(tasks_by_status.values())
    completed_tasks = tasks_by_status.get("completed", 0)
    productivity_score = int((completed_tasks / max(total_tasks, 1)) * 100)
    
    return AnalyticsResponse(
        tasks_by_status=tasks_by_status,
        tasks_by_priority=tasks_by_priority,
        tasks_completed_over_time=tasks_completed_over_time,
        notes_by_color=notes_by_color,
        posts_published_over_time=posts_published_over_time,
        activity_over_time=activity_over_time,
        productivity_score=productivity_score
    )

# ==================== EXPORT ====================

@router.post("/export")
async def export_data(
    export_req: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export user data in CSV or JSON format."""
    data = {}
    
    if export_req.entity_type in ["tasks", "all"]:
        result = await db.execute(
            select(Task).options(selectinload(Task.tags)).where(Task.user_id == current_user.id)
        )
        tasks = result.scalars().all()
        data["tasks"] = [{
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "tags": [tag.name for tag in t.tags],
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        } for t in tasks]
    
    if export_req.entity_type in ["notes", "all"]:
        result = await db.execute(
            select(Note).options(selectinload(Note.tags)).where(Note.user_id == current_user.id)
        )
        notes = result.scalars().all()
        data["notes"] = [{
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "color": n.color,
            "is_pinned": n.is_pinned,
            "tags": [tag.name for tag in n.tags],
            "created_at": n.created_at.isoformat(),
            "updated_at": n.updated_at.isoformat()
        } for n in notes]
    
    if export_req.entity_type in ["posts", "all"]:
        result = await db.execute(
            select(Post).options(selectinload(Post.tags)).where(Post.user_id == current_user.id)
        )
        posts = result.scalars().all()
        data["posts"] = [{
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "is_published": p.is_published,
            "published_at": p.published_at.isoformat() if p.published_at else None,
            "tags": [tag.name for tag in p.tags],
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat()
        } for p in posts]
    
    if export_req.format == "json":
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=flow_export.json"}
        )
    else:
        output = io.StringIO()
        for entity_type, items in data.items():
            if items:
                output.write(f"\n=== {entity_type.upper()} ===\n")
                writer = csv.DictWriter(output, fieldnames=items[0].keys())
                writer.writeheader()
                for item in items:
                    row = {k: (', '.join(v) if isinstance(v, list) else v) for k, v in item.items()}
                    writer.writerow(row)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=flow_export.csv"}
        )

# ==================== DASHBOARD STATS ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for current user."""
    result = await db.execute(
        select(
            func.count(Task.id),
            func.count(Task.id).filter(Task.status == "completed"),
            func.count(Task.id).filter(Task.status == "in_progress"),
        ).where(Task.user_id == current_user.id)
    )
    task_total, task_completed, task_in_progress = result.one()
    
    result = await db.execute(
        select(
            func.count(Note.id),
            func.count(Note.id).filter(Note.is_pinned == True),
        ).where(Note.user_id == current_user.id)
    )
    note_total, note_pinned = result.one()
    
    result = await db.execute(
        select(
            func.count(Post.id),
            func.count(Post.id).filter(Post.is_published == True),
        ).where(Post.user_id == current_user.id)
    )
    post_total, post_published = result.one()
    
    tag_result = await db.execute(
        select(func.count(Tag.id)).where(Tag.user_id == current_user.id)
    )
    tag_total = tag_result.scalar() or 0
    
    return {
        "tasks": {
            "total": task_total or 0,
            "completed": task_completed or 0,
            "in_progress": task_in_progress or 0
        },
        "notes": {
            "total": note_total or 0,
            "pinned": note_pinned or 0
        },
        "posts": {
            "total": post_total or 0,
            "published": post_published or 0
        },
        "tags": {
            "total": tag_total
        }
    }
