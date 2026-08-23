"""
User Profile and Organization Workspace Schema Models.
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserProfileBase(BaseModel):
    email: EmailStr
    name: str
    organization_name: str
    role: str = "Collections Admin"
    currency_preference: str = "INR"
    auto_escalation_enabled: bool = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None
    currency_preference: Optional[str] = None
    auto_escalation_enabled: Optional[bool] = None

class UserProfileResponse(UserProfileBase):
    id: str
    workspace_id: str
    active_invoices_count: int = 0
    total_recovered_amount_inr: float = 0.0

    class Config:
        from_attributes = True
