"""
Payment Reconciliation and Razorpay Smart Recovery Handler.
Validates signatures, processes captured payments, and automatically marks invoices as PAID.
"""
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PaymentReconciler:
    """Reconciles incoming Razorpay webhook events with pending invoices."""
    
    @staticmethod
    def verify_webhook_signature(payload_body: bytes, signature: str, secret: str) -> bool:
        """Cryptographically verifies HMAC-SHA256 signature from Razorpay webhook headers."""
        if not signature or not secret:
            return False
        try:
            expected_sig = hmac.new(
                secret.encode("utf-8"),
                payload_body,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_sig, signature)
        except Exception as e:
            logger.error(f"Error validating webhook signature: {e}")
            return False

    @staticmethod
    def parse_payment_event(event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extracts standard invoice and transaction details from Razorpay event payload."""
        event_name = event_data.get("event")
        if event_name not in ["payment.captured", "payment_link.paid", "order.paid"]:
            return None
        
        payload = event_data.get("payload", {})
        payment = payload.get("payment", {}).get("entity", {})
        
        return {
            "event": event_name,
            "payment_id": payment.get("id"),
            "amount_paid_inr": payment.get("amount", 0) / 100.0,
            "currency": payment.get("currency", "INR"),
            "notes": payment.get("notes", {}),
            "invoice_id": payment.get("notes", {}).get("invoice_id")
        }
