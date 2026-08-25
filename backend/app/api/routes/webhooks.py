"""
FastAPI routes for Razorpay payment webhooks and demo payment simulation.
FR10-FR13, FR23: Webhook verification and atomic payment resolution.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.idempotency import IdempotencyRecord
from app.services.razorpay_client import verify_razorpay_webhook_signature
from app.services.state_machine import transition_invoice_status

router = APIRouter(prefix="/webhooks", tags=["Webhooks & Payment Verification"])


class PaymentSimulateInput(BaseModel):
    invoice_id: str
    payment_id: str = "pay_simulated_12345"


@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    FR11-FR13: Handles Razorpay payment.captured webhook events.
    Verifies HMAC signature, checks idempotency / replay protection,
    atomically updates invoice to PAID, and marks promises KEPT.

    The signature is checked on every request, not only when a signature header
    happens to be present — otherwise omitting the header is enough to mark any
    invoice PAID, and "only a verified webhook can close an invoice" stops being true.
    """
    raw_body = await request.body()
    body_text = raw_body.decode("utf-8")

    # Verified against the RAW body: Razorpay signs the exact bytes it sent, so
    # re-serialising the parsed JSON would produce a different digest.
    check = verify_razorpay_webhook_signature(body_text, x_razorpay_signature)
    if not check.accept:
        raise HTTPException(status_code=400, detail=check.detail)

    payload = await request.json()
    event = payload.get("event")

    if event in ("payment.captured", "payment.authorized") or not event:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        payment_id = payment_entity.get("id") or payload.get("payment_id")
        notes = payment_entity.get("notes", {})
        invoice_id = notes.get("invoice_id") or payment_entity.get("description") or payload.get("invoice_id")

        if not invoice_id:
            return {"status": "ignored", "reason": "No invoice_id found in payment notes"}

        # Idempotency / Replay protection check
        if payment_id:
            existing_record = db.query(IdempotencyRecord).filter(
                IdempotencyRecord.id == payment_id,
                IdempotencyRecord.scope == "razorpay_webhook"
            ).first()
            if existing_record:
                return {
                    "status": "success",
                    "message": "Payment event already processed (idempotent replay protection)",
                    "payment_id": payment_id
                }

        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return {"status": "ignored", "reason": f"Invoice {invoice_id} not found"}

        if invoice.status == InvoiceStatus.PAID:
            return {"status": "success", "message": "Invoice already paid"}

        # Update active promises to KEPT
        active_promises = db.query(Promise).filter(
            Promise.invoice_id == invoice.id,
            Promise.status == PromiseStatus.ACTIVE
        ).all()
        for p in active_promises:
            p.status = PromiseStatus.KEPT

        # Single transition to PAID
        transition_invoice_status(
            db, invoice, InvoiceStatus.PAID,
            trigger="razorpay_webhook_payment_captured",
            actor="system",
            rule_applied="payment_captured_verification" if check.verified else "payment_captured_unverified_signature",
            detail=f"Webhook event '{event}'. Payment ID: {payment_id}. {check.detail} Invoice marked PAID."
        )

        # Record idempotency record
        if payment_id:
            db.add(IdempotencyRecord(
                id=payment_id,
                scope="razorpay_webhook",
                status="processed",
                response_payload=f"invoice_id:{invoice.id}"
            ))

        db.commit()

        return {
            "status": "success",
            "invoice_id": invoice.id,
            "new_status": invoice.status.value,
            "payment_id": payment_id,
            "signature_verified": check.verified,
        }

    return {"status": "ignored", "event": event}



@router.post("/simulate-payment")
def simulate_payment(input_data: PaymentSimulateInput, db: Session = Depends(get_db)):
    """
    Demo/Testing endpoint to simulate a captured payment for an invoice.
    FR23: Real/simulated payment event resolves pending_verification to PAID.
    """
    invoice = db.query(Invoice).filter(Invoice.id == input_data.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{input_data.invoice_id}' not found.")

    if invoice.status == InvoiceStatus.PAID:
        return {"invoice_id": invoice.id, "status": invoice.status.value, "message": "Already paid."}

    # Update active promises to KEPT
    active_promises = db.query(Promise).filter(
        Promise.invoice_id == invoice.id,
        Promise.status == PromiseStatus.ACTIVE
    ).all()
    for p in active_promises:
        p.status = PromiseStatus.KEPT

    # Single transition to PAID.
    #
    # This is a *simulated* payment, so it must not borrow the audit label used for
    # signature-verified Razorpay webhooks. Claiming "Razorpay confirmed the payment"
    # for a button click would make the audit trail assert a verification that never
    # happened — and the product's whole argument is that the log can be trusted.
    transition_invoice_status(
        db, invoice, InvoiceStatus.PAID,
        trigger="demo_simulated_payment",
        actor="user",
        rule_applied="simulated_payment_no_verification",
        detail=(
            f"Simulated payment received ({input_data.payment_id}). Invoice resolved to PAID. "
            "This was a manual simulation — no Razorpay webhook was verified."
        )
    )
    db.commit()

    return {
        "invoice_id": invoice.id,
        "status": invoice.status.value,
        "signature_verified": False,
        "message": "Simulated payment recorded. Invoice closed as PAID (no webhook was verified)."
    }
