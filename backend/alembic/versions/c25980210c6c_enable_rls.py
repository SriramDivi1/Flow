"""enable_rls

Revision ID: c25980210c6c
Revises: d47e9f25d16e
Create Date: 2026-02-18 11:43:30.390579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c25980210c6c'
down_revision: Union[str, Sequence[str], None] = 'd47e9f25d16e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable RLS on all tables
    tables = [
        'users', 'tasks', 'notes', 'posts', 'tags', 'activities',
        'task_tags', 'note_tags', 'post_tags'
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")

    # Users table policy
    op.execute(
        "CREATE POLICY \"Users can manage their own data\" ON users FOR ALL "
        "USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id)"
    )

    # Tables with user_id
    user_owned_tables = ['tasks', 'notes', 'posts', 'tags', 'activities']
    for table in user_owned_tables:
        op.execute(
            f"CREATE POLICY \"Users can manage their own {table}\" ON {table} FOR ALL "
            f"USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id)"
        )

    # Join tables
    op.execute(
        "CREATE POLICY \"Users can manage their own task tags\" ON task_tags FOR ALL "
        "USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text)) "
        "WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()::text))"
    )
    
    op.execute(
        "CREATE POLICY \"Users can manage their own note tags\" ON note_tags FOR ALL "
        "USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()::text)) "
        "WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()::text))"
    )

    op.execute(
        "CREATE POLICY \"Users can manage their own post tags\" ON post_tags FOR ALL "
        "USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_tags.post_id AND posts.user_id = auth.uid()::text)) "
        "WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_tags.post_id AND posts.user_id = auth.uid()::text))"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop policies
    op.execute("DROP POLICY IF EXISTS \"Users can manage their own data\" ON users")
    
    user_owned_tables = ['tasks', 'notes', 'posts', 'tags', 'activities']
    for table in user_owned_tables:
        op.execute(f"DROP POLICY IF EXISTS \"Users can manage their own {table}\" ON {table}")

    op.execute("DROP POLICY IF EXISTS \"Users can manage their own task tags\" ON task_tags")
    op.execute("DROP POLICY IF EXISTS \"Users can manage their own note tags\" ON note_tags")
    op.execute("DROP POLICY IF EXISTS \"Users can manage their own post tags\" ON post_tags")

    # Disable RLS
    tables = [
        'users', 'tasks', 'notes', 'posts', 'tags', 'activities',
        'task_tags', 'note_tags', 'post_tags'
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
