"""
Scheduler tick engine.
Evaluates all non-closed invoices, enforces stopping rules (cooldown, touch caps, pending verification),
executes escalation touches, and logs every decision (including no-ops) to ActionLog.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rules import next_channel
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.services.state_machine import transition_invoice_status
from app.services.notifier import send_notification


def run_scheduler_tick(db: Session, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Runs a single cycle of the scheduler tick engine across all active invoices.
    Returns a list of decision records for API/logging.
    """
    if now is None:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
    elif now.tzinfo:
        now = now.replace(tzinfo=None)


    # FR13: Structurally exclude paid & written-off invoices from query
    invoices = db.query(Invoice).filter(
        Invoice.status.notin_([InvoiceStatus.PAID, InvoiceStatus.WRITTEN_OFF])
    ).all()

    tick_results = []

    for invoice in invoices:
        # Check active promises for expiry / broken promises
        for promise in invoice.promises:
            if promise.status == PromiseStatus.ACTIVE and promise.promised_date:
                if now > promise.promised_date:
                    promise.status = PromiseStatus.BROKEN
                    if invoice.status == InvoiceStatus.PROMISE_MADE:
                        transition_invoice_status(
                            db, invoice, InvoiceStatus.PROMISE_DUE,
                            trigger="scheduler_promise_expired",
                            actor="system",
                            rule_applied="promise_date_passed",
                            detail=f"Promise date {promise.promised_date.strftime('%Y-%m-%d')} passed without payment."
                        )

        # Rule 1: Pending Verification Pause (FR21, FR22)
        if invoice.status == InvoiceStatus.PENDING_VERIFICATION:
            log_entry = ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=now,
                trigger="scheduler_tick",
                action_taken="no_op",
                rule_applied="pending_verification_pause",
                rule_that_blocked="pending_verification_pause",
                actor="system",
                detail="Outbound actions paused while customer payment claim is pending verification."
            )
            db.add(log_entry)
            tick_results.append({
                "invoice_id": invoice.id,
                "action": "no_op",
                "reason": "pending_verification_pause"
            })
            continue

        # Rule 2: Hard touch cap check (FR17)
        if invoice.touch_count >= settings.max_touches_per_invoice:
            if invoice.status != InvoiceStatus.ESCALATED:
                transition_invoice_status(
                    db, invoice, InvoiceStatus.ESCALATED,
                    trigger="scheduler_tick",
                    actor="system",
                    rule_applied="max_touches_reached",
                    detail=f"Invoice hit maximum touch limit of {settings.max_touches_per_invoice}. Handoff to human review."
                )

            log_entry = ActionLog(
                id=str(uuid.uuid4()),
                invoice_id=invoice.id,
                timestamp=now,
                trigger="scheduler_tick",
                action_taken="no_op",
                rule_applied="human_handoff_active",
                rule_that_blocked="max_touches_reached",
                actor="system",
                detail=f"Max touches ({settings.max_touches_per_invoice}) reached. Invoice escalated to human collection agent."
            )
            db.add(log_entry)
            tick_results.append({
                "invoice_id": invoice.id,
                "action": "no_op",
                "reason": "max_touches_reached"
            })
            continue

        # Rule 3: Minimum Cooldown period (FR18)
        if invoice.last_touch_at:
            days_since_last = (now - invoice.last_touch_at).total_seconds() / 86400.0
            if days_since_last < settings.cooldown_days_between_touches:
                log_entry = ActionLog(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    timestamp=now,
                    trigger="scheduler_tick",
                    action_taken="no_op",
                    rule_applied="cooldown_enforcement",
                    rule_that_blocked="cooldown_active",
                    actor="system",
                    detail=f"Cooldown active ({days_since_last:.1f}/{settings.cooldown_days_between_touches} days elapsed since last touch)."
                )
                db.add(log_entry)
                tick_results.append({
                    "invoice_id": invoice.id,
                    "action": "no_op",
                    "reason": "cooldown_active"
                })
                continue

        # If all rules pass: execute next touch in escalation ladder
        channel = next_channel(invoice.touch_count)
        if not channel:
            continue

        # Execute simulated touch
        notification_res = send_notification(
            customer_name=invoice.customer_name,
            channel=channel,
            touch_number=invoice.touch_count + 1,
            amount=invoice.amount,
            due_date_str=invoice.due_date.strftime("%Y-%m-%d")
        )

        invoice.touch_count += 1
        invoice.last_touch_at = now

        # Update status if invoice was overdue/created
        if invoice.status in (InvoiceStatus.CREATED, InvoiceStatus.DUE_SOON):
            transition_invoice_status(
                db, invoice, InvoiceStatus.OVERDUE,
                trigger="scheduler_tick",
                actor="ai",
                rule_applied="first_escalation_touch",
                detail=f"Escalation touch #{invoice.touch_count} sent via {channel.value}."
            )

        # Log executed touch
        log_entry = ActionLog(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            timestamp=now,
            trigger="scheduler_tick",
            action_taken=f"sent_{channel.value}",
            rule_applied=f"escalation_ladder_step_{invoice.touch_count}",
            rule_that_blocked=None,
            actor="ai",
            detail=f"Sent touch #{invoice.touch_count} via {channel.value}. Subject/Content: {notification_res.get('subject', notification_res.get('body'))}"
        )
        db.add(log_entry)

        tick_results.append({
            "invoice_id": invoice.id,
            "action": f"sent_{channel.value}",
            "touch_number": invoice.touch_count
        })

    db.commit()
    return tick_results
