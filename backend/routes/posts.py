"""Post routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional, List

from database import get_db
from models import User, Post, Tag, post_tags
from schemas import PostCreate, PostUpdate, PostResponse
from auth import get_current_user
from helpers import sanitize_search, log_activity

router = APIRouter()

@router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    response: Response,
    search: Optional[str] = Query(None),
    is_published: Optional[bool] = Query(None),
    tag_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all posts for current user with optional filters."""
    query = select(Post).options(selectinload(Post.tags)).where(Post.user_id == current_user.id)
    
    if search:
        safe = sanitize_search(search)
        query = query.where(
            or_(
                Post.title.ilike(f"%{safe}%"),
                Post.content.ilike(f"%{safe}%")
            )
        )
    if is_published is not None:
        query = query.where(Post.is_published == is_published)
    if tag_id:
        query = query.join(post_tags).where(post_tags.c.tag_id == tag_id)
    
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    response.headers["X-Total-Count"] = str(count_result.scalar() or 0)
    
    query = query.order_by(Post.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new post."""
    post = Post(
        user_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        is_published=post_data.is_published,
        published_at=datetime.now(timezone.utc) if post_data.is_published else None
    )
    db.add(post)
    await db.flush()
    
    if post_data.tag_ids:
        for tag_id in post_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                post.tags.append(tag)
    
    await db.commit()
    
    result = await db.execute(
        select(Post).options(selectinload(Post.tags)).where(Post.id == post.id)
    )
    post = result.scalar_one()
    
    action = "published" if post.is_published else "created"
    await log_activity(db, current_user.id, action, "post", post.id, post.title)
    
    return post

@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific post."""
    result = await db.execute(
        select(Post).options(selectinload(Post.tags)).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a post."""
    result = await db.execute(
        select(Post).options(selectinload(Post.tags)).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    was_published = post.is_published
    
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.is_published is not None:
        post.is_published = post_data.is_published
        if post_data.is_published and not post.published_at:
            post.published_at = datetime.now(timezone.utc)
    
    if post_data.tag_ids is not None:
        post.tags.clear()
        for tag_id in post_data.tag_ids:
            result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
            )
            tag = result.scalar_one_or_none()
            if tag:
                post.tags.append(tag)
    
    post.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(post)
    
    if not was_published and post.is_published:
        await log_activity(db, current_user.id, "published", "post", post.id, post.title)
    else:
        await log_activity(db, current_user.id, "updated", "post", post.id, post.title)
    
    return post

@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a post."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == current_user.id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post_title = post.title
    await db.delete(post)
    await db.commit()
    
    await log_activity(db, current_user.id, "deleted", "post", post_id, post_title)
