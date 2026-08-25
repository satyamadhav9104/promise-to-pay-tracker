"""Unit tests for business escalation rules, touch caps, cooldown, and pause conditions."""
from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.core.rules import next_channel, Channel, check_touch_allowed
from app.scheduler.tick import run_scheduler_tick


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def make_invoice(db, invoice_id, **overrides):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    fields = dict(
        id=invoice_id,
        customer_name="Rule Test Customer",
        customer_email="billing@ruletest.com",
        amount=5000.0,
        due_date=now - timedelta(days=5),
        status=InvoiceStatus.OVERDUE,
        touch_count=0,
        last_touch_at=None,
    )
    fields.update(overrides)
    invoice = Invoice(**fields)
    db.add(invoice)
    db.commit()
    return invoice


def test_escalation_ladder_channels():
    assert next_channel(0) == Channel.EMAIL
    assert next_channel(1) == Channel.EMAIL
    assert next_channel(2) == Channel.WHATSAPP
    assert next_channel(3) is None


def test_cooldown_and_touch_cap_in_scheduler(db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = make_invoice(db, "RULE-101", due_date=now - timedelta(days=5))

    # Tick 1: executes touch 1 (email)
    res1 = run_scheduler_tick(db, now=now)
    assert len(res1) == 1
    assert res1[0]["action"] == "sent_email"
    assert inv.touch_count == 1

    # Tick 2 an hour later: blocked by the 4-day cooldown
    res2 = run_scheduler_tick(db, now=now + timedelta(hours=1))
    assert res2[0]["action"] == "no_op"
    assert res2[0]["reason"] == "cooldown_active"
    assert inv.touch_count == 1

    # Tick 3 after 5 days: touch 2 (email)
    res3 = run_scheduler_tick(db, now=now + timedelta(days=5))
    assert res3[0]["action"] == "sent_email"
    assert inv.touch_count == 2

    # Tick 4 after 10 days: touch 3 (whatsapp — final notice)
    res4 = run_scheduler_tick(db, now=now + timedelta(days=10))
    assert res4[0]["action"] == "sent_whatsapp"
    assert inv.touch_count == 3

    # Tick 5 after 15 days: cap reached, handed to a human
    res5 = run_scheduler_tick(db, now=now + timedelta(days=15))
    assert res5[0]["action"] == "no_op"
    assert res5[0]["reason"] == "max_touches_reached"
    assert inv.status == InvoiceStatus.ESCALATED

    # Tick 6: an escalated invoice is out of the agent's hands and must not be
    # re-evaluated, or the audit trail fills with identical handoff rows.
    res6 = run_scheduler_tick(db, now=now + timedelta(days=20))
    assert res6 == []


def test_repeated_cooldown_ticks_do_not_duplicate_audit_rows(db):
    """The sweep runs every 5 minutes; the audit trail must stay readable."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    make_invoice(db, "RULE-DEDUPE", touch_count=1, last_touch_at=now)

    for minutes in (0, 5, 10, 15):
        run_scheduler_tick(db, now=now + timedelta(minutes=minutes))

    cooldown_rows = db.query(ActionLog).filter(
        ActionLog.invoice_id == "RULE-DEDUPE",
        ActionLog.rule_that_blocked == "cooldown_active"
    ).count()
    assert cooldown_rows == 1


def test_active_promise_pauses_outbound_touches(db):
    """An approved promise is a commitment to wait. Chasing anyway defeats the product."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = make_invoice(db, "RULE-PROMISE", status=InvoiceStatus.PROMISE_MADE)

    db.add(Promise(
        id="P-RULE-PROMISE",
        invoice_id=inv.id,
        promised_date=now + timedelta(days=7),
        confidence_score=0.92,
        source_text="We will pay next week.",
        status=PromiseStatus.ACTIVE,
    ))
    db.commit()

    allowed, reason, _detail = check_touch_allowed(inv, now)
    assert allowed is False
    assert reason == "active_promise_pause"

    res = run_scheduler_tick(db, now=now)
    assert res[0]["reason"] == "active_promise_pause"
    assert inv.touch_count == 0

    blocked = db.query(ActionLog).filter(
        ActionLog.invoice_id == "RULE-PROMISE",
        ActionLog.rule_that_blocked == "active_promise_pause"
    ).first()
    assert blocked is not None


def test_expired_promise_resumes_chasing_and_is_logged(db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = make_invoice(db, "RULE-EXPIRED", status=InvoiceStatus.PROMISE_MADE)

    db.add(Promise(
        id="P-RULE-EXPIRED",
        invoice_id=inv.id,
        promised_date=now - timedelta(days=1),
        confidence_score=0.92,
        source_text="We will pay yesterday.",
        status=PromiseStatus.ACTIVE,
    ))
    db.commit()

    run_scheduler_tick(db, now=now)

    promise = db.query(Promise).filter(Promise.id == "P-RULE-EXPIRED").first()
    assert promise.status == PromiseStatus.BROKEN
    assert inv.status in (InvoiceStatus.PROMISE_DUE, InvoiceStatus.OVERDUE)


def test_pending_verification_blocks_touches(db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = make_invoice(db, "RULE-PENDING", status=InvoiceStatus.PENDING_VERIFICATION)

    allowed, reason, _detail = check_touch_allowed(inv, now)
    assert allowed is False
    assert reason == "pending_verification_pause"


def test_terminal_invoices_are_never_contacted(db):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    inv = make_invoice(db, "RULE-PAID", status=InvoiceStatus.PAID)

    allowed, reason, _detail = check_touch_allowed(inv, now)
    assert allowed is False
    assert reason == "invoice_closed"


def test_manual_email_cannot_exceed_the_touch_cap(db):
    """
    The UI's "send reminder" button shares the guardrail with the scheduler, so clicking
    it repeatedly cannot drive touch_count past the cap.
    """
    from app.api.routes.invoices import send_invoice_email

    inv = make_invoice(db, "RULE-MANUAL", touch_count=0, last_touch_at=None)

    first = send_invoice_email(invoice_id="RULE-MANUAL", db=db)
    assert first["sent"] is True
    assert first["touch_count"] == 1

    # Immediately again: the cooldown has not elapsed.
    second = send_invoice_email(invoice_id="RULE-MANUAL", db=db)
    assert second["sent"] is False
    assert second["blocked_by"] == "cooldown_active"

    db.refresh(inv)
    assert inv.touch_count == 1

    # Even with the cooldown cleared, the hard cap still holds.
    inv.touch_count = settings.max_touches_per_invoice
    inv.last_touch_at = None
    db.commit()

    third = send_invoice_email(invoice_id="RULE-MANUAL", db=db)
    assert third["sent"] is False
    assert third["blocked_by"] == "max_touches_reached"
    db.refresh(inv)
    assert inv.touch_count == settings.max_touches_per_invoice
