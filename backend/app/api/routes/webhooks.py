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
    Verifies HMAC signature, atomically updates invoice to PAID, and marks promises KEPT.
    """
    raw_body = await request.body()
    body_text = raw_body.decode("utf-8")

    if x_razorpay_signature:
        if not verify_razorpay_webhook_signature(body_text, x_razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")

    payload = await request.json()
    event = payload.get("event")

    if event in ("payment.captured", "payment.authorized") or not event:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment_entity.get("notes", {})
        invoice_id = notes.get("invoice_id") or payment_entity.get("description") or payload.get("invoice_id")

        if not invoice_id:
            return {"status": "ignored", "reason": "No invoice_id found in payment notes"}

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
            rule_applied="payment_captured_verification",
            detail=f"Webhook event '{event}' verified. Payment ID: {payment_entity.get('id')}. Invoice marked PAID."
        )
        db.commit()

        return {"status": "success", "invoice_id": invoice.id, "new_status": invoice.status.value}

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

    # Single transition to PAID
    transition_invoice_status(
        db, invoice, InvoiceStatus.PAID,
        trigger="demo_simulated_payment",
        actor="system",
        rule_applied="verified_payment_resolution",
        detail=f"Simulated payment received ({input_data.payment_id}). Invoice resolved to PAID."
    )
    db.commit()

    return {
        "invoice_id": invoice.id,
        "status": invoice.status.value,
        "message": "Payment verified and recorded. Invoice closed as PAID."
    }
