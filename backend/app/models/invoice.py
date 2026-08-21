"""Invoice model — the central entity all state transitions revolve around."""
import enum
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base


class InvoiceStatus(str, enum.Enum):
    CREATED = "created"
    DUE_SOON = "due_soon"
    OVERDUE = "overdue"
    PROMISE_MADE = "promise_made"
    PROMISE_DUE = "promise_due"
    PENDING_VERIFICATION = "pending_verification"  # unverified payment claim
    ESCALATED = "escalated"
    PAID = "paid"
    WRITTEN_OFF = "written_off"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True)
    customer_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.CREATED, nullable=False)
    touch_count = Column(Integer, default=0, nullable=False)
    last_touch_at = Column(DateTime, nullable=True)

    promises = relationship("Promise", back_populates="invoice", cascade="all, delete-orphan")
    action_logs = relationship("ActionLog", back_populates="invoice", cascade="all, delete-orphan")
