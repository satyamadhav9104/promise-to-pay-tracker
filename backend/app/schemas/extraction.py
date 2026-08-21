"""Pydantic schema for LLM payment promise & claim extraction result."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PromiseExtractionResult(BaseModel):
    is_promise: bool = Field(..., description="Whether the text contains a promise to pay in the future")
    is_payment_claim: bool = Field(..., description="Whether the customer claims they have ALREADY made the payment")
    promised_date: Optional[datetime] = Field(None, description="Extracted ISO date of promised payment, if any")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    reasoning: str = Field(..., description="Explanation of why this extraction decision was made")


class CustomerReplyInput(BaseModel):
    invoice_id: str
    reply_text: str
