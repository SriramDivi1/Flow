from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class TaskStatusEnum(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v):
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Tag Schemas
class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = "default"

class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = None

class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    color: str
    created_at: datetime

# User Schemas
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    email_verified: Optional[bool] = False
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.TODO
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    tag_ids: Optional[List[str]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    due_date: Optional[datetime] = None
    position: Optional[int] = None
    tag_ids: Optional[List[str]] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    position: Optional[int] = 0
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

class TaskReorder(BaseModel):
    task_ids: List[str]

# Note Schemas
class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    color: Optional[str] = "default"
    is_pinned: Optional[bool] = False
    tag_ids: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None
    tag_ids: Optional[List[str]] = None

class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    title: str
    content: Optional[str] = None
    color: str
    is_pinned: bool
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

# Post Schemas
class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    is_published: Optional[bool] = False
    tag_ids: Optional[List[str]] = []

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    is_published: Optional[bool] = None
    tag_ids: Optional[List[str]] = None

class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    title: str
    content: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

# Activity Schemas
class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    entity_title: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    tasks_by_status: dict
    tasks_by_priority: dict
    tasks_completed_over_time: List[dict]
    notes_by_color: dict
    posts_published_over_time: List[dict]
    activity_over_time: List[dict]
    productivity_score: int

# Export Schemas
class ExportRequest(BaseModel):
    entity_type: str  # tasks, notes, posts, all
    format: str = "csv"  # csv or json
