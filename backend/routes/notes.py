"""Note routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional, List

from database import get_db
from models import User, Note, Tag, note_tags
from schemas import NoteCreate, NoteUpdate, NoteResponse
from auth import get_current_user
from helpers import sanitize_search, log_activity

router = APIRouter()

@router.get("/notes", response_model=List[NoteResponse])
async def get_notes(
    response: Response,
    search: Optional[str] = Query(None),
    is_pinned: Optional[bool] = Query(None),
    color: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all notes for current user with optional filters."""
    query = select(Note).options(selectinload(Note.tags)).where(Note.user_id == current_user.id)
    
    if search:
        safe = sanitize_search(search)
        query = query.where(
            or_(
                Note.title.ilike(f"%{safe}%"),
                Note.content.ilike(f"%{safe}%")
            )
        )
    if is_pinned is not None:
        query = query.where(Note.is_pinned == is_pinned)
    if color and color != 'all':
        query = query.where(Note.color == color)
    if tag_id:
        query = query.join(note_tags).where(note_tags.c.tag_id == tag_id)
    
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    response.headers["X-Total-Count"] = str(count_result.scalar() or 0)
    
    query = query.order_by(Note.is_pinned.desc(), Note.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/notes", response_model=NoteResponse, status_code=201)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new note."""
    note = Note(
        user_id=current_user.id,
        title=note_data.title,
        content=note_data.content,
        color=note_data.color,
        is_pinned=note_data.is_pinned
    )
    db.add(note)
    await db.flush()
    
    if note_data.tag_ids:
        for tag_id in note_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                note.tags.append(tag)
    
    await db.commit()
    
    result = await db.execute(
        select(Note).options(selectinload(Note.tags)).where(Note.id == note.id)
    )
    note = result.scalar_one()
    
    await log_activity(db, current_user.id, "created", "note", note.id, note.title)
    
    return note

@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific note."""
    result = await db.execute(
        select(Note).options(selectinload(Note.tags)).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a note."""
    result = await db.execute(
        select(Note).options(selectinload(Note.tags)).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note_data.title is not None:
        note.title = note_data.title
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.color is not None:
        note.color = note_data.color
    if note_data.is_pinned is not None:
        note.is_pinned = note_data.is_pinned
    
    if note_data.tag_ids is not None:
        note.tags.clear()
        for tag_id in note_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                note.tags.append(tag)
    
    note.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(note)
    
    await log_activity(db, current_user.id, "updated", "note", note.id, note.title)
    
    return note

@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a note."""
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note_title = note.title
    await db.delete(note)
    await db.commit()
    
    await log_activity(db, current_user.id, "deleted", "note", note_id, note_title)
