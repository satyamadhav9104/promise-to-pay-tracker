"""
Razorpay API & Webhook verification service.
Handles live & test mode Razorpay integration, Orders API, Payment Links, and HMAC webhook signature checks.
"""
import hmac
import hashlib
import logging
import time
from typing import Optional, Dict, Any, NamedTuple

from app.core.config import settings

logger = logging.getLogger(__name__)


class SignatureCheck(NamedTuple):
    """
    Outcome of a signature check — used by both the webhook and the checkout path.

    `accept` and `verified` are deliberately separate. With no secret configured —
    the default for a local clone — we still accept the payment so the demo runs
    offline, but `verified` stays False so the audit trail can say the payment was
    never cryptographically proven. Conflating the two is how a system ends up
    claiming a guarantee it does not enforce.
    """
    accept: bool
    verified: bool
    reason: str
    detail: str


def get_razorpay_client():
    """Initializes and returns official Razorpay Python Client."""
    try:
        import razorpay
        if settings.razorpay_key_id and settings.razorpay_key_secret:
            return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    except Exception as e:
        logger.warning(f"Could not initialize Razorpay Client: {e}")
    return None


def create_razorpay_order(
    amount: float,
    invoice_id: str,
    currency: str = "INR",
    notes: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Creates a Razorpay Order for Checkout popup.
    Amount is passed in Rupees and converted to Paise (x100).
    """
    client = get_razorpay_client()
    amount_in_paise = int(round(amount * 100))
    order_notes = notes or {}
    order_notes["invoice_id"] = invoice_id

    if client:
        try:
            order_data = {
                "amount": amount_in_paise,
                "currency": currency,
                "receipt": f"rcpt_{invoice_id[:20]}",
                "notes": order_notes
            }
            order = client.order.create(data=order_data)
            logger.info(f"[RAZORPAY ORDER CREATED] ID: {order.get('id')} | Amount: {amount}")
            return {
                "order_id": order.get("id"),
                "amount": amount_in_paise,
                "currency": currency,
                "key_id": settings.razorpay_key_id,
                "status": order.get("status", "created")
            }
        except Exception as e:
            logger.error(f"[RAZORPAY ORDER FAILED] Error: {e}. Falling back to test order.")

    fallback_order_id = f"order_{invoice_id.replace('-', '').lower()}_{int(time.time())}"
    return {
        "order_id": fallback_order_id,
        "amount": amount_in_paise,
        "currency": currency,
        "key_id": settings.razorpay_key_id or "rzp_test_TSRi5elb8AdVBV",
        "status": "created",
        "is_mock": True
    }


def verify_razorpay_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> SignatureCheck:
    """
    Verifies a Razorpay standard-checkout payment signature.
    HMAC_SHA256(order_id + '|' + payment_id, key_secret) == signature

    Returns a SignatureCheck for the same reason the webhook path does. Without a real
    key secret there is nothing to verify against, so the payment is accepted (the
    offline demo has to work) but `verified` is False — and the caller must not label
    the resulting audit row "Razorpay Payment Verified".
    """
    client = get_razorpay_client()
    key_secret = settings.razorpay_key_secret

    if client and key_secret:
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature
            })
            return SignatureCheck(
                accept=True,
                verified=True,
                reason="signature_verified",
                detail="Signature verified by the Razorpay SDK (HMAC-SHA256 over order_id|payment_id)."
            )
        except Exception as e:
            # Fall through to the manual HMAC below rather than accepting. The SDK
            # raising means either a forged signature or a broken client, and neither
            # is a reason to close an invoice.
            logger.warning(f"Razorpay official signature verify note: {e}")

    if not key_secret or key_secret == "mock_secret_12345":
        # Simulated checkout: no real key, so no digest can be computed.
        logger.warning(
            "RAZORPAY_KEY_SECRET is unset or the mock placeholder — accepting the "
            "checkout callback without verifying its signature."
        )
        return SignatureCheck(
            accept=True,
            verified=False,
            reason="unverified_simulated_checkout",
            detail=(
                "Signature NOT verified: no real RAZORPAY_KEY_SECRET is configured, "
                "so this checkout was simulated."
            )
        )

    if not razorpay_signature:
        return SignatureCheck(
            accept=False,
            verified=False,
            reason="signature_missing",
            detail="Rejected: no razorpay_signature was supplied by the checkout callback."
        )

    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected = hmac.new(key_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    if hmac.compare_digest(expected, razorpay_signature):
        return SignatureCheck(
            accept=True,
            verified=True,
            reason="signature_verified",
            detail="Signature verified against RAZORPAY_KEY_SECRET (HMAC-SHA256 over order_id|payment_id)."
        )

    return SignatureCheck(
        accept=False,
        verified=False,
        reason="signature_mismatch",
        detail="Rejected: razorpay_signature did not match the expected HMAC-SHA256 digest."
    )


def create_razorpay_payment_link(
    amount: float,
    invoice_id: str,
    customer_name: str,
    customer_email: Optional[str] = None,
    description: str = ""
) -> str:
    """
    Creates an official Razorpay Payment Link (https://rzp.io/i/...)
    """
    client = get_razorpay_client()
    amount_in_paise = int(round(amount * 100))

    if client:
        try:
            link_payload = {
                "amount": amount_in_paise,
                "currency": "INR",
                "accept_partial": False,
                "description": description or f"Payment for Invoice {invoice_id}",
                "customer": {
                    "name": customer_name,
                    "email": customer_email or "billing@example.com"
                },
                "notify": {"sms": False, "email": True},
                "reminder_enable": True,
                "notes": {"invoice_id": invoice_id}
            }
            link_resp = client.payment_link.create(link_payload)
            short_url = link_resp.get("short_url")
            if short_url:
                logger.info(f"[RAZORPAY LINK CREATED] URL: {short_url}")
                return short_url
        except Exception as e:
            logger.error(f"[RAZORPAY LINK FAILED] Error: {e}")

    return f"https://rzp.io/l/pay_{customer_name.lower().replace(' ', '')}_{invoice_id.lower().replace('-', '')}"


def verify_razorpay_webhook_signature(payload_body: str, signature: Optional[str], secret: Optional[str] = None) -> SignatureCheck:
    """
    Verifies the Razorpay HMAC-SHA256 webhook signature.

    Razorpay signs the exact raw request body with the webhook secret, so the caller
    must pass the untouched bytes — re-serialising the parsed JSON changes whitespace
    and key order and the digest will not match.

    Returns a SignatureCheck rather than a bool so the caller can record *whether the
    payment was actually proven*, not merely whether it was accepted.
    """
    webhook_secret = secret or settings.razorpay_webhook_secret

    if not webhook_secret:
        # No secret to check against. Accept (so an offline clone can demo the flow)
        # but never claim the event was verified.
        logger.warning(
            "RAZORPAY_WEBHOOK_SECRET is not set — accepting the webhook without "
            "verifying its signature. Set the secret to enforce verification."
        )
        return SignatureCheck(
            accept=True,
            verified=False,
            reason="unverified_no_secret_configured",
            detail="Signature NOT verified: no RAZORPAY_WEBHOOK_SECRET is configured on the server."
        )

    if not signature:
        return SignatureCheck(
            accept=False,
            verified=False,
            reason="signature_missing",
            detail="Rejected: the X-Razorpay-Signature header was missing."
        )

    expected_signature = hmac.new(
        key=webhook_secret.encode("utf-8"),
        msg=payload_body.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()

    if hmac.compare_digest(expected_signature, signature):
        return SignatureCheck(
            accept=True,
            verified=True,
            reason="signature_verified",
            detail="Signature verified against RAZORPAY_WEBHOOK_SECRET (HMAC-SHA256)."
        )

    return SignatureCheck(
        accept=False,
        verified=False,
        reason="signature_mismatch",
        detail="Rejected: the X-Razorpay-Signature header did not match the expected HMAC-SHA256 digest."
    )


def sign_webhook_payload(payload_body: str, secret: Optional[str] = None) -> Optional[str]:
    """
    Produces the header value Razorpay would send for this body. Used by
    scripts/trigger_demo_webhook.py so the demo exercises the real verification
    path instead of routing around it.
    """
    webhook_secret = secret or settings.razorpay_webhook_secret
    if not webhook_secret:
        return None
    return hmac.new(
        key=webhook_secret.encode("utf-8"),
        msg=payload_body.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
