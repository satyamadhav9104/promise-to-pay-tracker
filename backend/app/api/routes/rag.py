"""
FastAPI REST API routes for RAG (Retrieval-Augmented Generation) pipeline operations.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.rag_service import generate_personalized_nudge_rag, query_receivables_rag, retrieve_invoice_context, generate_cashflow_vendor_rag

router = APIRouter(tags=["RAG Pipeline"])


class NudgeRequest(BaseModel):
    invoice_id: str
    channel: Optional[str] = "email"


class AskRequest(BaseModel):
    query: str


@router.post("/rag/personalized-nudge")
def get_personalized_nudge(req: NudgeRequest, db: Session = Depends(get_db)):
    """
    RAG Endpoint: Generates a personalized email/WhatsApp nudge for an invoice by retrieving
    customer history & audit logs and augmenting the Gemini LLM prompt.
    """
    try:
        result = generate_personalized_nudge_rag(db, req.invoice_id, channel=req.channel or "email")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Nudge generation error: {str(e)}")


@router.post("/rag/ask")
def ask_receivables(req: AskRequest, db: Session = Depends(get_db)):
    """
    RAG Endpoint: "Ask Your Receivables" AI Financial Assistant.
    Retrieves database invoice records and answers free-form questions using Gemini LLM.
    """
    try:
        result = query_receivables_rag(db, req.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query execution error: {str(e)}")


@router.get("/rag/context/{invoice_id}")
def get_invoice_rag_context(invoice_id: str, db: Session = Depends(get_db)):
    """
    RAG Step 1 Inspector: Returns raw retrieved database context for an invoice.
    """
    context = retrieve_invoice_context(db, invoice_id)
    return context


@router.post("/rag/vendor-advice/{invoice_id}")
def get_vendor_rag_advice(invoice_id: str, db: Session = Depends(get_db)):
    """
    RAG Endpoint: Generates smart cash flow payment advice for vendor payables & pending bills.
    """
    try:
        result = generate_cashflow_vendor_rag(db, invoice_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor RAG advice error: {str(e)}")
