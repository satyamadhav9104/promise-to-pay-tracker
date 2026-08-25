"""Pydantic schemas for Invoice serialization and API contracts."""
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict, Field

from app.models.invoice import InvoiceStatus
from app.schemas.promise import PromiseResponse


class InvoiceBase(BaseModel):
    id: str
    user_id: Optional[str] = None
    customer_name: str
    customer_email: Optional[str] = None
    invoice_type: Optional[str] = "receivable"
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

    # Guardrail visibility (FR27-FR30): how often the agent chose *not* to act, and why.
    paid_invoices_count: int = 0
    awaiting_review_count: int = 0
    actions_blocked_count: int = 0
    blocked_breakdown: Dict[str, int] = {}


class GuardrailSettings(BaseModel):
    """Live escalation guardrails. Read by the Settings page so the values shown are real."""
    max_touches_per_invoice: int
    cooldown_days_between_touches: int
    promise_confidence_threshold: float


class GuardrailSettingsUpdate(BaseModel):
    max_touches_per_invoice: Optional[int] = Field(default=None, ge=1, le=10)
    cooldown_days_between_touches: Optional[int] = Field(default=None, ge=0, le=60)
    promise_confidence_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)

