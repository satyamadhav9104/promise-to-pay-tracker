"""
Hard-coded business rules for escalation. These are intentionally NOT
LLM-decided — the model chooses timing/tone, never whether to exceed
caps or add channels. See docs/architecture.md for rationale.
"""
from enum import Enum


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
