"""secure_alembic_version

Revision ID: 0451f991de72
Revises: c25980210c6c
Create Date: 2026-02-18 11:51:58.179543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0451f991de72'
down_revision: Union[str, Sequence[str], None] = 'c25980210c6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY")
