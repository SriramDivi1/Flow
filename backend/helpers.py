"""Shared helper functions used across route modules."""
from sqlalchemy.ext.asyncio import AsyncSession
from models import Activity
import logging

logger = logging.getLogger(__name__)


def sanitize_search(term: str) -> str:
    """Escape SQL LIKE wildcards to prevent injection."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def log_activity(db: AsyncSession, user_id: str, action: str, entity_type: str,
                       entity_id: str = None, entity_title: str = None, details: str = None):
    """Log a user activity. Failures are non-fatal to avoid breaking main operations."""
    try:
        activity = Activity(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_title=entity_title,
            details=details
        )
        db.add(activity)
        await db.flush()
    except Exception as e:
        logger.warning(f"Failed to log activity: {e}")
