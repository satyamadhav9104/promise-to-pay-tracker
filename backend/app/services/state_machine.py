"""
Invoice State Machine service.
Enforces FR4: Single, testable transition function for all invoice status changes.
No direct mutation of invoice.status is allowed elsewhere in the codebase.
"""
import uuid
from typing import Optional, Set
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceStatus
from app.models.action_log import ActionLog

# Define allowed transitions for each state
ALLOWED_TRANSITIONS: dict[InvoiceStatus, Set[InvoiceStatus]] = {
    InvoiceStatus.CREATED: {
        InvoiceStatus.DUE_SOON,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.PROMISE_MADE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.PAID,
    },
    InvoiceStatus.DUE_SOON: {
        InvoiceStatus.OVERDUE,
        InvoiceStatus.PROMISE_MADE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.PAID,
    },
    InvoiceStatus.OVERDUE: {
        InvoiceStatus.PROMISE_MADE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.PAID,
        InvoiceStatus.WRITTEN_OFF,
    },
    InvoiceStatus.PROMISE_MADE: {
        InvoiceStatus.PROMISE_DUE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.PAID,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.OVERDUE,
    },
    InvoiceStatus.PROMISE_DUE: {
        InvoiceStatus.PROMISE_MADE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.PAID,
    },
    InvoiceStatus.PENDING_VERIFICATION: {
        InvoiceStatus.PAID,
        InvoiceStatus.ESCALATED,
        InvoiceStatus.OVERDUE,
        InvoiceStatus.PROMISE_MADE,
    },
    InvoiceStatus.ESCALATED: {
        InvoiceStatus.PROMISE_MADE,
        InvoiceStatus.PENDING_VERIFICATION,
        InvoiceStatus.PAID,
        InvoiceStatus.WRITTEN_OFF,
        InvoiceStatus.OVERDUE,
    },
    # Terminal states have no outbound transitions
    InvoiceStatus.PAID: set(),
    InvoiceStatus.WRITTEN_OFF: set(),
}


class InvalidStateTransitionError(ValueError):
    """Raised when an invalid invoice status transition is attempted."""
    pass


def transition_invoice_status(
    db: Session,
    invoice: Invoice,
    target_status: InvoiceStatus,
    trigger: str,
    actor: str = "system",
    rule_applied: str = "valid_state_transition",
    rule_that_blocked: Optional[str] = None,
    detail: Optional[str] = None
) -> Invoice:
    """
    Executes an invoice status transition atomically and logs the event to ActionLog.
    Enforces state transition rules and terminal state immutability.
    """
    current_status = invoice.status

    if current_status == target_status:
        return invoice

    # Terminal state check
    if current_status in (InvoiceStatus.PAID, InvoiceStatus.WRITTEN_OFF):
        raise InvalidStateTransitionError(
            f"Cannot transition invoice {invoice.id} from terminal state '{current_status.value}' to '{target_status.value}'"
        )

    # Allowed transition check
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise InvalidStateTransitionError(
            f"Invalid transition for invoice {invoice.id}: '{current_status.value}' -> '{target_status.value}'"
        )

    # Perform transition
    invoice.status = target_status

    # Record audit log entry
    log_entry = ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        trigger=trigger,
        action_taken=f"status_changed:{current_status.value}->{target_status.value}",
        rule_applied=rule_applied,
        rule_that_blocked=rule_that_blocked,
        actor=actor,
        detail=detail or f"Invoice {invoice.id} moved from {current_status.value} to {target_status.value}."
    )
    db.add(log_entry)
    db.flush()

    return invoice
