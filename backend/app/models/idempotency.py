"""
IdempotencyRecord model for tracking and deduplicating webhook events and API mutations.
Protects against webhook replay attacks and duplicate payment captures.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.db.base import Base


def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(String(128), primary_key=True)  # event_id or payment_id
    scope = Column(String(64), nullable=False, default="razorpay_webhook")  # e.g. "razorpay_webhook", "api_mutation"
    status = Column(String(32), nullable=False, default="processed")  # "processing", "processed", "failed"
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    response_payload = Column(Text, nullable=True)
