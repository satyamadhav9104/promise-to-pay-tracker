"""Promise model — stores structured payment commitments extracted from customer replies."""
import enum
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class PromiseStatus(str, enum.Enum):
    ACTIVE = "active"
    KEPT = "kept"
    BROKEN = "broken"
    FLAGGED_HUMAN_REVIEW = "flagged_human_review"


class Promise(Base):
    __tablename__ = "promises"

    id = Column(String(64), primary_key=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id"), nullable=False)
    promised_date = Column(DateTime, nullable=True)
    confidence_score = Column(Float, nullable=False)
    reasoning = Column(Text, nullable=True)
    source_text = Column(Text, nullable=False)
    status = Column(SAEnum(PromiseStatus), default=PromiseStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("Invoice", back_populates="promises")
