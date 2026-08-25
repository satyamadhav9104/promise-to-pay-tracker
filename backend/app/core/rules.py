"""
Hard-coded business rules for escalation. These are intentionally NOT
LLM-decided — the model chooses timing/tone, never whether to exceed
caps or add channels. See docs/architecture.md for rationale.
"""
from enum import Enum
from datetime import datetime
from typing import Optional, Tuple

from app.core.config import settings


class Channel(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"  # simulated — see services/notifier.py


ESCALATION_LADDER = [
    Channel.EMAIL,       # touch 1: gentle reminder
    Channel.EMAIL,       # touch 2: firmer tone
    Channel.WHATSAPP,    # touch 3: final notice (simulated channel)
]


def next_channel(touch_count: int) -> Channel | None:
    """Returns the channel for the next touch, or None if the cap is hit."""
    if touch_count >= len(ESCALATION_LADDER):
        return None
    return ESCALATION_LADDER[touch_count]


# --- Stopping rules (FR17, FR18, FR21) ------------------------------------
#
# Single source of truth for "may we contact this customer right now?".
# Every outbound path must consult this: the scheduler sweep, the manual
# "send email" button, and the promise-rejection auto-nudge. Keeping the
# check in one place is what makes the touch cap and cooldown a real
# guardrail rather than a claim that only the scheduler honours.

def check_touch_allowed(invoice, now: Optional[datetime] = None) -> Tuple[bool, Optional[str], str]:
    """
    Decides whether an outbound touch may be sent for this invoice.

    Returns (allowed, rule_that_blocked, detail). When allowed is True the
    rule_that_blocked is None and detail explains which touch is next.
    """
    from app.models.invoice import InvoiceStatus
    from app.models.promise import PromiseStatus

    if now is None:
        now = datetime.utcnow()
    elif now.tzinfo:
        now = now.replace(tzinfo=None)

    if invoice.status in (InvoiceStatus.PAID, InvoiceStatus.WRITTEN_OFF):
        return False, "invoice_closed", (
            f"Invoice is closed with status '{invoice.status.value}'. No further outreach is possible."
        )

    if invoice.status == InvoiceStatus.PENDING_VERIFICATION:
        return False, "pending_verification_pause", (
            "Outbound actions paused while the customer's payment claim is pending Razorpay verification."
        )

    # An approved, not-yet-due promise means we agreed to wait. Chasing anyway
    # would contradict the whole premise of the product.
    for promise in getattr(invoice, "promises", []) or []:
        if promise.status == PromiseStatus.ACTIVE and promise.promised_date:
            promised = promise.promised_date
            if promised.tzinfo:
                promised = promised.replace(tzinfo=None)
            if promised >= now:
                days_left = (promised - now).total_seconds() / 86400.0
                return False, "active_promise_pause", (
                    f"Customer promised payment by {promised.strftime('%Y-%m-%d')} "
                    f"({days_left:.1f} days away). Holding off until that date passes."
                )

    if invoice.touch_count >= settings.max_touches_per_invoice:
        return False, "max_touches_reached", (
            f"Max touches ({settings.max_touches_per_invoice}) reached. "
            "Invoice belongs to a human collection agent now."
        )

    if invoice.last_touch_at:
        last = invoice.last_touch_at
        if last.tzinfo:
            last = last.replace(tzinfo=None)
        days_since_last = (now - last).total_seconds() / 86400.0
        if days_since_last < settings.cooldown_days_between_touches:
            return False, "cooldown_active", (
                f"Cooldown active ({days_since_last:.1f} of "
                f"{settings.cooldown_days_between_touches} days elapsed since the last touch)."
            )

    channel = next_channel(invoice.touch_count)
    if channel is None:
        return False, "max_touches_reached", (
            f"Escalation ladder exhausted after {invoice.touch_count} touches."
        )

    return True, None, (
        f"Touch {invoice.touch_count + 1} of {settings.max_touches_per_invoice} "
        f"is allowed via {channel.value}."
    )

