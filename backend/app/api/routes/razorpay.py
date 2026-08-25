"""
FastAPI routes for Razorpay Order generation, Live Checkout verification, and Payment Links.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.services.razorpay_client import (
    create_razorpay_order,
    verify_razorpay_payment_signature,
    create_razorpay_payment_link
)
from app.services.state_machine import transition_invoice_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/razorpay", tags=["Razorpay Checkout & Orders"])


class CreateOrderRequest(BaseModel):
    invoice_id: str
    amount: Optional[float] = None


class VerifyPaymentRequest(BaseModel):
    invoice_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class CreatePaymentLinkRequest(BaseModel):
    invoice_id: str


@router.post("/create-order")
def api_create_razorpay_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Creates a real or test Razorpay Order for frontend standard checkout popup.
    """
    invoice = db.query(Invoice).filter(Invoice.id == request.invoice_id).first()
    amount = request.amount or (invoice.amount if invoice else 1000.0)
    customer_name = invoice.customer_name if invoice else "Customer"
    customer_email = invoice.customer_email if invoice and hasattr(invoice, "customer_email") else "customer@example.com"

    order_info = create_razorpay_order(
        amount=amount,
        invoice_id=request.invoice_id,
        currency="INR",
        notes={"invoice_id": request.invoice_id, "customer_name": customer_name}
    )

    return {
        "success": True,
        "order_id": order_info["order_id"],
        "amount": order_info["amount"],
        "currency": order_info["currency"],
        "key_id": order_info["key_id"],
        "invoice_id": request.invoice_id,
        "customer_name": customer_name,
        "customer_email": customer_email
    }


@router.post("/verify-payment")
def api_verify_razorpay_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Resolves a Razorpay standard-checkout callback and closes the invoice as PAID.

    The signature is checked when a real key secret is configured; with the mock
    placeholder there is nothing to check against, so the payment is accepted but the
    audit row records that no signature was verified.
    """
    check = verify_razorpay_payment_signature(
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_signature=request.razorpay_signature
    )

    if not check.accept:
        raise HTTPException(status_code=400, detail=check.detail)

    invoice = db.query(Invoice).filter(Invoice.id == request.invoice_id).first()
    # Previously a missing invoice still returned {"status": "paid"}, so the checkout
    # sheet showed "Payment captured" for an invoice that was never touched.
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{request.invoice_id}' not found.")

    if invoice.status != InvoiceStatus.PAID:
        # Mark active promises as KEPT
        active_promises = db.query(Promise).filter(
            Promise.invoice_id == invoice.id,
            Promise.status == PromiseStatus.ACTIVE
        ).all()
        for p in active_promises:
            p.status = PromiseStatus.KEPT

        # The label follows what was actually proven. Writing "Razorpay Payment
        # Verified" for a simulated checkout would make the audit trail assert a
        # cryptographic guarantee the server never checked.
        transition_invoice_status(
            db, invoice, InvoiceStatus.PAID,
            trigger=(
                "razorpay_checkout_payment_verified" if check.verified
                else "razorpay_checkout_payment_unverified"
            ),
            actor="system",
            rule_applied="razorpay_live_checkout" if check.verified else "razorpay_simulated_checkout",
            detail=(
                f"Razorpay checkout payment {request.razorpay_payment_id} "
                f"(order {request.razorpay_order_id}). {check.detail}"
            )
        )
        db.commit()

    return {
        "success": True,
        "invoice_id": invoice.id,
        "status": invoice.status.value,
        "payment_id": request.razorpay_payment_id,
        "signature_verified": check.verified,
        "message": (
            f"Payment {request.razorpay_payment_id} verified. Invoice marked as PAID."
            if check.verified
            else f"Payment {request.razorpay_payment_id} accepted from a simulated checkout "
                 "(signature not verified). Invoice marked as PAID."
        )
    }


@router.post("/create-payment-link")
def api_create_razorpay_payment_link(
    request: CreatePaymentLinkRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a shareable Razorpay payment link.
    """
    invoice = db.query(Invoice).filter(Invoice.id == request.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    link_url = create_razorpay_payment_link(
        amount=invoice.amount,
        invoice_id=invoice.id,
        customer_name=invoice.customer_name,
        customer_email=getattr(invoice, "customer_email", None),
        description=f"Payment for Invoice {invoice.id}"
    )

    return {
        "success": True,
        "invoice_id": invoice.id,
        "payment_link": link_url
    }

