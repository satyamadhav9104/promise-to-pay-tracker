"""
FastAPI routes for Audit Log queries and manual Scheduler Tick triggering.
FR24-FR26: Audit trail API exposing full traceable decision history.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.session import get_db
from app.models.action_log import ActionLog
from app.scheduler.tick import run_scheduler_tick

router = APIRouter(tags=["Audit & Scheduler"])


class ActionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    invoice_id: str
    timestamp: datetime
    trigger: str
    action_taken: str
    rule_applied: str
    rule_that_blocked: Optional[str] = None
    actor: str
    detail: Optional[str] = None


@router.get("/audit", response_model=List[ActionLogResponse])
def list_audit_logs(
    invoice_id: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    FR26: Retrieves audit trail logs, optionally filtered by invoice_id or actor.
    """
    query = db.query(ActionLog)
    if invoice_id:
        query = query.filter(ActionLog.invoice_id == invoice_id)
    if actor:
        query = query.filter(ActionLog.actor == actor)
    return query.order_by(ActionLog.timestamp.desc()).offset(offset).limit(limit).all()


@router.post("/scheduler/tick")
def trigger_scheduler_tick(db: Session = Depends(get_db)):
    """
    FR14: Triggers a manual scheduler tick cycle across all invoices.
    Useful for interactive demos and testing touch progression.
    """
    results = run_scheduler_tick(db)
    return {
        "status": "success",
        "processed_count": len(results),
        "results": results
    }
