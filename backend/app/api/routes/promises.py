"""FastAPI routes for customer reply extraction and promise logging."""
import uuid
from datetime import datetime, timezone
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
from app.services.notifier import send_notification
from app.core.rules import Channel, check_touch_allowed

router = APIRouter(prefix="/promises", tags=["Promises & Replies"])


def get_current_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)



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
        # FR5-FR9: the model proposes, the threshold decides. A confident extraction
        # with a concrete date is auto-accepted; anything vaguer goes to a human.
        # A high score with no parseable date is still ambiguous, so it needs review —
        # without a date the scheduler has nothing to hold the customer to.
        threshold = settings.promise_confidence_threshold
        auto_accepted = bool(
            result.confidence_score >= threshold and result.promised_date is not None
        )
        promised_str = result.promised_date.strftime('%Y-%m-%d') if result.promised_date else 'an unspecified date'

        promise_record = Promise(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            promised_date=result.promised_date,
            confidence_score=result.confidence_score,
            reasoning=result.reasoning,
            source_text=input_data.reply_text,
            status=PromiseStatus.ACTIVE if auto_accepted else PromiseStatus.FLAGGED_HUMAN_REVIEW,
            created_at=get_current_utc()
        )
        db.add(promise_record)

        if auto_accepted:
            invoice.due_date = result.promised_date
            db.add(invoice)

            db.add(ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=get_current_utc(),
                trigger="customer_reply",
                action_taken="promise_auto_accepted",
                rule_applied="auto_accepted_high_confidence",
                actor="ai",
                detail=(
                    f"Extracted a payment promise for {promised_str} with confidence "
                    f"{result.confidence_score:.2f}, at or above the {threshold:.2f} threshold, "
                    "so it was accepted automatically and outbound chasing is paused until that date."
                )
            ))

            transition_invoice_status(
                db, invoice, InvoiceStatus.PROMISE_MADE,
                trigger="customer_reply",
                actor="ai",
                rule_applied="auto_accepted_high_confidence",
                detail=f"Promise for {promised_str} accepted automatically (confidence {result.confidence_score:.2f} >= {threshold:.2f})."
            )
            message = f"Payment promise accepted automatically for {promised_str}."
        else:
            reason = (
                "no specific date could be extracted"
                if result.promised_date is None
                else f"confidence {result.confidence_score:.2f} is below the {threshold:.2f} threshold"
            )
            db.add(ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=get_current_utc(),
                trigger="customer_reply",
                action_taken="promise_proposed_awaiting_approval",
                rule_applied="low_confidence_human_review",
                rule_that_blocked="below_confidence_threshold",
                actor="ai",
                detail=(
                    f"Extracted a possible payment promise for {promised_str}, but {reason}. "
                    "Routed to a human for approval or rejection instead of acting on it."
                )
            ))
            message = "Payment promise proposed. Awaiting approval or rejection."

        db.commit()
        db.refresh(promise_record)
        db.refresh(invoice)

        return {
            "invoice_id": invoice.id,
            "status": invoice.status.value,
            "extraction": result.model_dump(),
            "promise": PromiseResponse.model_validate(promise_record).model_dump(),
            "auto_accepted": auto_accepted,
            "confidence_threshold": threshold,
            "message": message
        }

    # No promise or claim detected
    log_entry = ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        timestamp=get_current_utc(),
        trigger="customer_reply",
        action_taken="no_op",
        rule_applied="reply_analysis",
        rule_that_blocked="no_promise_detected",
        actor="ai",
        detail="Analyzed reply. No payment promise or claim detected."
    )
    db.add(log_entry)
    db.commit()

    return {
        "invoice_id": invoice.id,
        "status": invoice.status.value,
        "extraction": result.model_dump(),
        "message": "Reply processed. No promise or claim detected."
    }


@router.post("/{promise_id}/approve")
def approve_promise(promise_id: str, db: Session = Depends(get_db)):
    """User manually approves a customer's proposed payment promise date."""
    promise = db.query(Promise).filter(Promise.id == promise_id).first()
    if not promise:
        promise = db.query(Promise).filter(Promise.invoice_id == promise_id).order_by(Promise.created_at.desc()).first()

    invoice = None
    if promise:
        invoice = db.query(Invoice).filter(Invoice.id == promise.invoice_id).first()
    else:
        invoice = db.query(Invoice).filter(Invoice.id == promise_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail=f"Promise or Invoice '{promise_id}' not found.")
        promise = Promise(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            promised_date=invoice.due_date,
            confidence_score=0.95,
            source_text="Approved payment promise",
            status=PromiseStatus.ACTIVE,
            created_at=get_current_utc()
        )
        db.add(promise)

    promise.status = PromiseStatus.ACTIVE
    if promise.promised_date and invoice:
        invoice.due_date = promise.promised_date
        db.add(invoice)

    if invoice:
        transition_invoice_status(
            db, invoice, InvoiceStatus.PROMISE_MADE,
            trigger="user_promise_approval",
            actor="user",
            rule_applied="human_approved_promise",
            detail=f"Admin manually APPROVED customer payment promise for {promise.promised_date.strftime('%Y-%m-%d') if promise.promised_date else 'committed date'}."
        )

    db.commit()
    return {
        "success": True,
        "message": f"Promise approved for {promise.promised_date.strftime('%Y-%m-%d') if promise.promised_date else 'new date'}!",
        "promise_id": promise.id,
        "status": "approved",
        "new_due_date": promise.promised_date.strftime('%Y-%m-%d') if promise.promised_date else None
    }


@router.post("/{promise_id}/reject")
def reject_promise(promise_id: str, db: Session = Depends(get_db)):
    """User manually rejects a customer's proposed promise date and sends reminder email."""
    promise = db.query(Promise).filter(Promise.id == promise_id).first()
    if not promise:
        promise = db.query(Promise).filter(Promise.invoice_id == promise_id).order_by(Promise.created_at.desc()).first()

    invoice = None
    if promise:
        invoice = db.query(Invoice).filter(Invoice.id == promise.invoice_id).first()
    else:
        invoice = db.query(Invoice).filter(Invoice.id == promise_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail=f"Promise or Invoice '{promise_id}' not found.")
        promise = Promise(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            promised_date=invoice.due_date,
            confidence_score=0.95,
            source_text="Rejected payment promise",
            status=PromiseStatus.BROKEN,
            created_at=get_current_utc()
        )
        db.add(promise)

    promise.status = PromiseStatus.BROKEN
    email_sent = False
    blocked_reason = None
    blocked_detail = None

    if invoice:
        transition_invoice_status(
            db, invoice, InvoiceStatus.ESCALATED,
            trigger="user_promise_rejection",
            actor="user",
            rule_applied="human_rejected_promise",
            detail=f"Admin REJECTED customer proposed payment promise ({promise.source_text}). Invoice escalated."
        )

        # The follow-up nudge is still an outbound touch, so it goes through the same
        # cap and cooldown check as the scheduler. Rejecting a promise does not buy
        # anyone extra contact attempts.
        now = get_current_utc()
        allowed, blocked_reason, blocked_detail = check_touch_allowed(invoice, now)

        if allowed:
            invoice.touch_count += 1
            invoice.last_touch_at = now
            due_str = invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else "N/A"
            recipient = getattr(invoice, 'customer_email', None) or f"{invoice.customer_name.lower().replace(' ', '.')}@example.com"

            result = send_notification(
                customer_name=invoice.customer_name,
                channel=Channel.EMAIL,
                touch_number=invoice.touch_count,
                amount=invoice.amount,
                due_date_str=due_str,
                recipient_email=recipient
            )
            email_sent = True

            db.add(ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=now,
                trigger="user_promise_rejection",
                action_taken="sent_email",
                rule_applied=f"escalation_ladder_step_{invoice.touch_count}",
                actor="user",
                detail=(
                    f"Sent 'Pay Now' reminder to {recipient} as touch #{invoice.touch_count} of "
                    f"{settings.max_touches_per_invoice} after the promise was rejected. "
                    f"{result.get('subject', '')}"
                )
            ))
        else:
            db.add(ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=now,
                trigger="user_promise_rejection",
                action_taken="no_op",
                rule_applied="outbound_guardrail",
                rule_that_blocked=blocked_reason,
                actor="system",
                detail=f"Promise rejected, but the follow-up reminder was withheld. {blocked_detail}"
            ))

    db.commit()

    if email_sent:
        message = "Promise rejected. Invoice escalated and a 'Pay Now' reminder email was sent."
    else:
        message = f"Promise rejected and invoice escalated. No reminder sent — {blocked_detail or 'no invoice attached.'}"

    return {
        "success": True,
        "message": message,
        "promise_id": promise.id,
        "status": "rejected",
        "email_sent": email_sent,
        "blocked_by": blocked_reason
    }
