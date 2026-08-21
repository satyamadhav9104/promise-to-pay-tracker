"""Pydantic schemas for Invoice serialization and API contracts."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models.invoice import InvoiceStatus
from app.schemas.promise import PromiseResponse


class InvoiceBase(BaseModel):
    id: str
    customer_name: str
    amount: float
    due_date: datetime


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)

    created_date: datetime
    status: InvoiceStatus
    touch_count: int
    last_touch_at: Optional[datetime] = None
    promises: List[PromiseResponse] = []


class MetricsResponse(BaseModel):
    total_invoices: int
    total_amount: float
    total_recovered_amount: float
    recovery_rate_percentage: float
    avg_days_to_recovery: float
    promises_kept_count: int
    promises_broken_count: int
    human_escalations_count: int
