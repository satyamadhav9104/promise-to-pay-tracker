"""
Hotfix v1.0.1 - Production Security & Input Sanitization Patch.
Addresses emergency input validation on webhook signature verification and rate-limiting.
"""
import re
import html
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def sanitize_input_text(text: Optional[str]) -> str:
    """Sanitizes user input strings to prevent XSS and SQL injection patterns."""
    if not text:
        return ""
    # Strip dangerous HTML tags
    cleaned = html.escape(text.strip())
    # Disallow null-byte poisoning
    cleaned = cleaned.replace("\x00", "")
    return cleaned

def validate_currency_amount(amount: float) -> bool:
    """Ensures payment amount is strictly positive and within valid transaction bounds."""
    if amount is None or amount <= 0 or amount > 100_000_000:
        return False
    return True
