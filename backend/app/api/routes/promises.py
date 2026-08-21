"""FastAPI routes for customer reply extraction and promise logging."""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.schemas.extraction import CustomerReplyInput, PromiseExtractionResult
from app.schemas.promise import PromiseResponse
from app.services.llm_extractor import extract_promise_from_reply
from app.services.state_machine import transition_invoice_status

router = APIRouter(prefix="/promises", tags=["Promises & Replies"])


@router.post("/extract")
def extract_and_log_reply(input_data: CustomerReplyInput, db: Session = Depends(get_db)):
    """
    FR5-FR9, FR21: Processes customer reply text.
    Extracts structured promise / claim via LLM, enforces confidence threshold, and applies state transition.
    """
    invoice = db.query(Invoice).filter(Invoice.id == input_data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{input_data.invoice_id}' not found.")

    if invoice.status in (InvoiceStatus.PAID, InvoiceStatus.WRITTEN_OFF):
        raise HTTPException(status_code=400, detail=f"Invoice is closed with status '{invoice.status.value}'.")

    # Extract structured result
    result: PromiseExtractionResult = extract_promise_from_reply(input_data.reply_text)

    promise_record = None

    # FR21: Unverified payment claim moves invoice to PENDING_VERIFICATION
    if result.is_payment_claim:
        transition_invoice_status(
            db, invoice, InvoiceStatus.PENDING_VERIFICATION,
            trigger="customer_reply_payment_claim",
            actor="ai",
            rule_applied="unverified_payment_claim_pause",
            detail=f"Customer claimed payment in reply: '{input_data.reply_text}'. Pausing automated actions pending webhook verification."
        )
        db.commit()
        return {
            "invoice_id": invoice.id,
            "status": invoice.status.value,
            "extraction": result.model_dump(),
            "message": "Payment claim received. Invoice moved to pending_verification."
        }

    # Promise extraction flow
    if result.is_promise:
        # FR8: Low confidence check threshold
        if result.confidence_score < settings.promise_confidence_threshold:
            promise_record = Promise(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                promised_date=result.promised_date,
                confidence_score=result.confidence_score,
                reasoning=result.reasoning,
                source_text=input_data.reply_text,
                status=PromiseStatus.FLAGGED_HUMAN_REVIEW,
                created_at=datetime.utcnow()
            )
            db.add(promise_record)

            log_entry = ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                trigger="customer_reply",
                action_taken="flagged_human_review",
                rule_applied="confidence_threshold_check",
                rule_that_blocked="confidence_below_threshold",
                actor="ai",
                detail=f"Extracted promise with low confidence score ({result.confidence_score:.2f} < {settings.promise_confidence_threshold}). Flagged for human review."
            )
            db.add(log_entry)
            db.commit()

            return {
                "invoice_id": invoice.id,
                "status": invoice.status.value,
                "extraction": result.model_dump(),
                "message": "Promise confidence below threshold. Flagged for human review."
            }
        else:
            # High confidence promise: Auto-log and update invoice status to PROMISE_MADE
            promise_record = Promise(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                promised_date=result.promised_date,
                confidence_score=result.confidence_score,
                reasoning=result.reasoning,
                source_text=input_data.reply_text,
                status=PromiseStatus.ACTIVE,
                created_at=datetime.utcnow()
            )
            db.add(promise_record)

            transition_invoice_status(
                db, invoice, InvoiceStatus.PROMISE_MADE,
                trigger="customer_reply_promise",
                actor="ai",
                rule_applied="valid_promise_extracted",
                detail=f"Payment promise logged for {result.promised_date.strftime('%Y-%m-%d') if result.promised_date else 'near future'}. Confidence: {result.confidence_score:.2f}."
            )
            db.commit()

            return {
                "invoice_id": invoice.id,
                "status": invoice.status.value,
                "extraction": result.model_dump(),
                "promise": PromiseResponse.model_validate(promise_record).model_dump(),
                "message": "Promise successfully extracted and logged."
            }

    # No promise or claim detected
    log_entry = ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        trigger="customer_reply",
        action_taken="no_op",
        rule_applied="reply_analysis",
        rule_that_blocked="no_promise_detected",
        actor="ai",
        detail=f"Analyzed reply. No payment promise or claim detected."
    )
    db.add(log_entry)
    db.commit()

    return {
        "invoice_id": invoice.id,
        "status": invoice.status.value,
        "extraction": result.model_dump(),
        "message": "Reply processed. No promise or claim detected."
    }
