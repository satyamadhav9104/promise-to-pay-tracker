"""
ActionLog — the audit trail. Every scheduler decision writes here,
including no-ops. This table is the primary evidence for judges of
'explainable, bounded, and gated' AI actions.
"""
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    trigger = Column(String, nullable=False)          # e.g. "scheduler_tick", "webhook", "customer_reply"
    action_taken = Column(String, nullable=False)      # e.g. "sent_email", "no_op", "status_updated"
    rule_applied = Column(String, nullable=False)       # rule that permitted the action
    rule_that_blocked = Column(String, nullable=True)   # rule that blocked it, if any
    actor = Column(String, default="system")            # ai | system | human
    detail = Column(Text, nullable=True)

    invoice = relationship("Invoice", back_populates="action_logs")
