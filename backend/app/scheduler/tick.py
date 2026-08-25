"""
Scheduler tick engine.
Evaluates all non-closed invoices, enforces stopping rules (cooldown, touch caps,
pending verification, active promises), executes escalation touches, and logs every
decision — including no-ops — to ActionLog.

The stopping rules themselves live in app/core/rules.check_touch_allowed so that the
manual "send email" button and the promise-rejection nudge obey exactly the same caps
as this sweep. See docs/requirements.md FR13, FR17, FR18, FR21.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rules import next_channel, check_touch_allowed
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.services.state_machine import transition_invoice_status
from app.services.notifier import send_notification


# Human-readable label for each stopping rule, used as the ActionLog.rule_applied.
BLOCK_RULE_LABELS = {
    "invoice_closed": "terminal_state_guard",
    "pending_verification_pause": "pending_verification_pause",
    "active_promise_pause": "active_promise_pause",
    "max_touches_reached": "human_handoff_active",
    "cooldown_active": "cooldown_enforcement",
}


def _last_log_for(db: Session, invoice_id: str) -> Optional[ActionLog]:
    """Most recent audit row for an invoice, used to avoid logging the same no-op twice."""
    return (
        db.query(ActionLog)
        .filter(ActionLog.invoice_id == invoice_id)
        .order_by(ActionLog.timestamp.desc(), ActionLog.id.desc())
        .first()
    )


def _record_blocked(db: Session, invoice: Invoice, now: datetime, reason: str, detail: str) -> bool:
    """
    Writes a blocked-decision audit row, unless the identical decision is already the
    invoice's most recent entry.

    The sweep runs every 300s, so logging unconditionally would bury the interesting
    rows under thousands of identical amber ones. Suppressing only *consecutive
    duplicates* keeps the trail complete — every change of decision is still recorded —
    while leaving the audit page readable, which is the point of having it.
    """
    last = _last_log_for(db, invoice.id)
    if last is not None and last.action_taken == "no_op" and last.rule_that_blocked == reason:
        return False

    db.add(ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        timestamp=now,
        trigger="scheduler_tick",
        action_taken="no_op",
        rule_applied=BLOCK_RULE_LABELS.get(reason, reason),
        rule_that_blocked=reason,
        actor="system",
        detail=detail,
    ))
    return True


def run_scheduler_tick(db: Session, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Runs a single cycle of the scheduler tick engine across all active invoices.
    Returns a list of decision records for API/logging.
    """
    if now is None:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
    elif now.tzinfo:
        now = now.replace(tzinfo=None)

    # FR13: structurally exclude closed invoices. ESCALATED is excluded too — once an
    # invoice is handed to a human the agent has no further decision to make, so
    # re-evaluating it every tick would only generate duplicate handoff rows.
    invoices = db.query(Invoice).filter(
        Invoice.status.notin_([
            InvoiceStatus.PAID,
            InvoiceStatus.WRITTEN_OFF,
            InvoiceStatus.ESCALATED,
        ])
    ).all()

    tick_results: List[Dict[str, Any]] = []

    for invoice in invoices:
        # --- Promise expiry: an approved promise whose date has passed is broken ---
        for promise in invoice.promises:
            if promise.status != PromiseStatus.ACTIVE or not promise.promised_date:
                continue
            promised = promise.promised_date
            if promised.tzinfo:
                promised = promised.replace(tzinfo=None)
            if now <= promised:
                continue

            promise.status = PromiseStatus.BROKEN

            if invoice.status == InvoiceStatus.PROMISE_MADE:
                transition_invoice_status(
                    db, invoice, InvoiceStatus.PROMISE_DUE,
                    trigger="scheduler_promise_expired",
                    actor="system",
                    rule_applied="promise_date_passed",
                    detail=f"Promise date {promised.strftime('%Y-%m-%d')} passed without payment."
                )
            else:
                # FR27: every decision is logged, including the ones that don't move
                # the invoice. Without this branch a promise could silently flip to
                # broken with no trace, which is exactly the hole the audit trail exists
                # to close.
                db.add(ActionLog(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    timestamp=now,
                    trigger="scheduler_promise_expired",
                    action_taken="promise_marked_broken",
                    rule_applied="promise_date_passed",
                    actor="system",
                    detail=(
                        f"Promise date {promised.strftime('%Y-%m-%d')} passed without payment. "
                        f"Invoice remained in '{invoice.status.value}'."
                    ),
                ))

        # --- Stopping rules ---
        allowed, reason, detail = check_touch_allowed(invoice, now)

        if not allowed:
            # Hitting the cap is the one blocked outcome that also changes state:
            # the invoice is handed to a human exactly once.
            if reason == "max_touches_reached" and invoice.status != InvoiceStatus.ESCALATED:
                transition_invoice_status(
                    db, invoice, InvoiceStatus.ESCALATED,
                    trigger="scheduler_tick",
                    actor="system",
                    rule_applied="max_touches_reached",
                    detail=(
                        f"Invoice hit the maximum of {settings.max_touches_per_invoice} touches. "
                        "Handing off to a human collection agent."
                    )
                )

            _record_blocked(db, invoice, now, reason, detail)
            tick_results.append({
                "invoice_id": invoice.id,
                "action": "no_op",
                "reason": reason,
                "detail": detail,
            })
            continue

        # --- Execute the next touch in the escalation ladder ---
        channel = next_channel(invoice.touch_count)
        if channel is None:
            # check_touch_allowed already guarantees a channel exists; belt and braces.
            continue

        notification_res = send_notification(
            customer_name=invoice.customer_name,
            channel=channel,
            touch_number=invoice.touch_count + 1,
            amount=invoice.amount,
            due_date_str=invoice.due_date.strftime("%Y-%m-%d"),
            recipient_email=getattr(invoice, "customer_email", None),
        )

        invoice.touch_count += 1
        invoice.last_touch_at = now

        if invoice.status in (InvoiceStatus.CREATED, InvoiceStatus.DUE_SOON):
            transition_invoice_status(
                db, invoice, InvoiceStatus.OVERDUE,
                trigger="scheduler_tick",
                actor="ai",
                rule_applied="first_escalation_touch",
                detail=f"Escalation touch #{invoice.touch_count} sent via {channel.value}."
            )

        db.add(ActionLog(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            timestamp=now,
            trigger="scheduler_tick",
            action_taken=f"sent_{channel.value}",
            rule_applied=f"escalation_ladder_step_{invoice.touch_count}",
            rule_that_blocked=None,
            actor="ai",
            detail=(
                f"Sent touch #{invoice.touch_count} of {settings.max_touches_per_invoice} "
                f"via {channel.value}. "
                f"{notification_res.get('subject', notification_res.get('body', ''))}"
            ),
        ))

        tick_results.append({
            "invoice_id": invoice.id,
            "action": f"sent_{channel.value}",
            "reason": None,
            "touch_number": invoice.touch_count,
        })

    db.commit()
    return tick_results
