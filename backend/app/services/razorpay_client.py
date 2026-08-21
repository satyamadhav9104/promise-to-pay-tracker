"""
Razorpay API & Webhook verification service.
Handles test-mode Razorpay integration and HMAC webhook signature checks.
"""
import hmac
import hashlib
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def verify_razorpay_webhook_signature(payload_body: str, signature: str, secret: Optional[str] = None) -> bool:
    """
    Verifies Razorpay HMAC SHA256 webhook signature.
    If secret is not configured or in test mode without secret, returns True with a warning.
    """
    webhook_secret = secret or settings.razorpay_webhook_secret

    if not webhook_secret:
        logger.warning("Razorpay webhook secret not configured. Skipping HMAC validation in test mode.")
        return True

    expected_signature = hmac.new(
        key=webhook_secret.encode("utf-8"),
        msg=payload_body.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)
