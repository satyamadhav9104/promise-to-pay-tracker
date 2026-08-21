"""Pydantic schemas for Promise serialization and API responses."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.promise import PromiseStatus


class PromiseBase(BaseModel):
    invoice_id: str
    promised_date: Optional[datetime] = None
    confidence_score: float
    reasoning: Optional[str] = None
    source_text: str


class PromiseCreate(PromiseBase):
    pass


class PromiseResponse(PromiseBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: PromiseStatus
    created_at: datetime
