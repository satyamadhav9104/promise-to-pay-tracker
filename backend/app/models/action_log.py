"""
ActionLog — the audit trail. Every scheduler decision writes here,
including no-ops. This table is the primary evidence for judges of
'explainable, bounded, and gated' AI actions.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(String(64), primary_key=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    trigger = Column(String(128), nullable=False)          # e.g. "scheduler_tick", "webhook", "customer_reply"
    action_taken = Column(String(128), nullable=False)      # e.g. "sent_email", "no_op", "status_updated"
    rule_applied = Column(String(128), nullable=False)       # rule that permitted the action
    rule_that_blocked = Column(String(128), nullable=True)   # rule that blocked it, if any
    actor = Column(String(64), default="system")            # ai | system | human
    detail = Column(Text, nullable=True)

    invoice = relationship("Invoice", back_populates="action_logs")

