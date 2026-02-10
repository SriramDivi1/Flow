import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship
from database import Base
import enum

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Association tables for many-to-many relationships
task_tags = Table(
    'task_tags',
    Base.metadata,
    Column('task_id', String(36), ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', String(36), ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

note_tags = Table(
    'note_tags',
    Base.metadata,
    Column('note_id', String(36), ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', String(36), ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

post_tags = Table(
    'post_tags',
    Base.metadata,
    Column('post_id', String(36), ForeignKey('posts.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', String(36), ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    tasks = relationship('Task', back_populates='user', cascade='all, delete-orphan')
    notes = relationship('Note', back_populates='user', cascade='all, delete-orphan')
    posts = relationship('Post', back_populates='user', cascade='all, delete-orphan')
    tags = relationship('Tag', back_populates='user', cascade='all, delete-orphan')
    activities = relationship('Activity', back_populates='user', cascade='all, delete-orphan')

class Tag(Base):
    __tablename__ = 'tags'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    color = Column(String(20), default='default')
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Relationships
    user = relationship('User', back_populates='tags')
    tasks = relationship('Task', secondary=task_tags, back_populates='tags')
    notes = relationship('Note', secondary=note_tags, back_populates='tags')
    posts = relationship('Post', secondary=post_tags, back_populates='tags')

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default=TaskStatus.TODO.value, index=True)
    priority = Column(String(20), default=TaskPriority.MEDIUM.value, index=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    user = relationship('User', back_populates='tasks')
    tags = relationship('Tag', secondary=task_tags, back_populates='tasks')

class Note(Base):
    __tablename__ = 'notes'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    color = Column(String(20), default='default')
    is_pinned = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    user = relationship('User', back_populates='notes')
    tags = relationship('Tag', secondary=note_tags, back_populates='notes')

class Post(Base):
    __tablename__ = 'posts'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    user = relationship('User', back_populates='posts')
    tags = relationship('Tag', secondary=post_tags, back_populates='posts')

class Activity(Base):
    __tablename__ = 'activities'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # created, updated, deleted, completed, published
    entity_type = Column(String(20), nullable=False)  # task, note, post
    entity_id = Column(String(36), nullable=True)
    entity_title = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    
    # Relationships
    user = relationship('User', back_populates='activities')
