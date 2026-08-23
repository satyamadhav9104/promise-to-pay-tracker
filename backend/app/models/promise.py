"""Promise model — stores structured payment commitments extracted from customer replies."""
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PromiseStatus(str, enum.Enum):
    ACTIVE = "active"
    KEPT = "kept"
    BROKEN = "broken"
    FLAGGED_HUMAN_REVIEW = "flagged_human_review"


class Promise(Base):
    __tablename__ = "promises"

    id = Column(String(64), primary_key=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id"), nullable=False, index=True)
    promised_date = Column(DateTime, nullable=True, index=True)
    confidence_score = Column(Float, nullable=False)
    reasoning = Column(Text, nullable=True)
    source_text = Column(Text, nullable=False)
    status = Column(SAEnum(PromiseStatus), default=PromiseStatus.ACTIVE, nullable=False, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    invoice = relationship("Invoice", back_populates="promises")

