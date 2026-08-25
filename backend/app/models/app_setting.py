"""
Runtime-overridable guardrail settings.

The escalation caps need to be adjustable from the Settings page *and* survive a
restart, so they live in a tiny key/value table rather than only in the environment.
Values are mirrored into app.core.config.settings on load and on update so that
check_touch_allowed keeps reading a plain attribute and needs no DB handle.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime

from app.db.base import Base


def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(64), primary_key=True)
    value = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
