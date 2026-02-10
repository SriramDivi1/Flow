"""Auth and profile routes."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import uuid
from pathlib import Path

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from helpers import log_activity

router = APIRouter()

ROOT_DIR = Path(__file__).parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}

# Rate limiting — imported from the app instance in server.py
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

# ==================== AUTH ROUTES ====================

@router.post("/auth/register", response_model=Token)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    await log_activity(db, user.id, "registered", "user", user.id, user.full_name)
    
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token)

@router.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get access token."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    await log_activity(db, user.id, "logged_in", "user", user.id, user.full_name)
    
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token)

@router.post("/auth/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token. Requires a valid (non-expired) token."""
    access_token = create_access_token(data={"sub": current_user.id})
    return Token(access_token=access_token)

# ==================== PROFILE ROUTES ====================

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    
    await log_activity(db, current_user.id, "updated", "profile", current_user.id, "Profile")
    
    return current_user

@router.post("/profile/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload avatar image for current user."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, GIF, WEBP"
        )
    
    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 5 MB"
        )
    
    # Sanitize extension to prevent path traversal
    ext = Path(file.filename).suffix.lstrip('.').lower() if file.filename else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        ext = "jpg"
    
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Ensure resolved path stays within uploads directory
    if not str(filepath.resolve()).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    # Delete old avatar if exists
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/"):
        old_file = ROOT_DIR / current_user.avatar_url.lstrip("/")
        if old_file.exists() and str(old_file.resolve()).startswith(str(UPLOAD_DIR.resolve())):
            old_file.unlink()
    
    # Save file
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
    
    current_user.avatar_url = f"/uploads/{filename}"
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    
    await log_activity(db, current_user.id, "updated", "profile", current_user.id, "Avatar")
    
    return current_user
