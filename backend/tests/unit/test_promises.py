"""Unit tests for promise extraction routing, approval, rejection, and touch guardrails."""
from datetime import datetime, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.schemas.extraction import CustomerReplyInput
from app.api.routes.promises import extract_and_log_reply, approve_promise, reject_promise


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def make_invoice(db, invoice_id, **overrides):
    fields = dict(
        id=invoice_id,
        customer_name="Acme Corp",
        customer_email="acme@example.com",
        amount=5000.0,
        due_date=datetime(2026, 8, 20),
        status=InvoiceStatus.OVERDUE,
        touch_count=0,
    )
    fields.update(overrides)
    invoice = Invoice(**fields)
    db.add(invoice)
    db.commit()
    return invoice


def test_high_confidence_promise_is_auto_accepted(db):
    """FR5-FR9: at or above the threshold the agent acts without waiting for a human."""
    inv = make_invoice(db, "INV-AUTO-1")

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-AUTO-1",
            reply_text="We will transfer the payment by 2026-08-30."
        ),
        db=db
    )

    assert res["auto_accepted"] is True
    assert res["extraction"]["confidence_score"] >= settings.promise_confidence_threshold

    promise = db.query(Promise).filter(Promise.id == res["promise"]["id"]).first()
    assert promise.status == PromiseStatus.ACTIVE

    db.refresh(inv)
    assert inv.status == InvoiceStatus.PROMISE_MADE
    assert inv.due_date.strftime("%Y-%m-%d") == "2026-08-30"

    # The decision must be explainable from the audit trail alone.
    log = db.query(ActionLog).filter(
        ActionLog.invoice_id == "INV-AUTO-1",
        ActionLog.action_taken == "promise_auto_accepted"
    ).first()
    assert log is not None
    assert log.rule_applied == "auto_accepted_high_confidence"


def test_low_confidence_promise_goes_to_human_review(db):
    """Below the threshold the agent proposes and stops; the invoice does not move."""
    inv = make_invoice(db, "INV-REVIEW-1")

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-REVIEW-1",
            reply_text="We are currently reviewing our cash flow and will try to pay soon."
        ),
        db=db
    )

    assert res["auto_accepted"] is False
    assert res["extraction"]["confidence_score"] < settings.promise_confidence_threshold

    promise = db.query(Promise).filter(Promise.id == res["promise"]["id"]).first()
    assert promise.status == PromiseStatus.FLAGGED_HUMAN_REVIEW

    db.refresh(inv)
    assert inv.status == InvoiceStatus.OVERDUE  # unchanged — no autonomous action taken

    log = db.query(ActionLog).filter(
        ActionLog.invoice_id == "INV-REVIEW-1",
        ActionLog.action_taken == "promise_proposed_awaiting_approval"
    ).first()
    assert log is not None
    assert log.rule_that_blocked == "below_confidence_threshold"


def test_human_can_approve_a_flagged_promise(db):
    make_invoice(db, "INV-APPROVE-1")

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-APPROVE-1",
            reply_text="We are working on it and will pay soon."
        ),
        db=db
    )
    promise_id = res["promise"]["id"]
    assert res["auto_accepted"] is False

    approve_res = approve_promise(promise_id=promise_id, db=db)
    assert approve_res["status"] == "approved"

    inv = db.query(Invoice).filter(Invoice.id == "INV-APPROVE-1").first()
    assert inv.status == InvoiceStatus.PROMISE_MADE

    promise = db.query(Promise).filter(Promise.id == promise_id).first()
    assert promise.status == PromiseStatus.ACTIVE


def test_promise_rejection_escalates_and_sends_one_touch(db):
    inv = make_invoice(
        db, "INV-REJECT-1",
        customer_name="Beta Logistics",
        customer_email="billing@betalogistics.com",
        amount=3200.0,
        due_date=datetime(2026, 8, 15),
        touch_count=1,
    )

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-REJECT-1",
            reply_text="We might be able to pay by September 15, 2026."
        ),
        db=db
    )
    promise_id = res["promise"]["id"]

    reject_res = reject_promise(promise_id=promise_id, db=db)
    assert reject_res["status"] == "rejected"
    assert reject_res["email_sent"] is True

    db.refresh(inv)
    assert inv.status == InvoiceStatus.ESCALATED
    assert inv.touch_count == 2
    assert inv.last_touch_at is not None

    promise = db.query(Promise).filter(Promise.id == promise_id).first()
    assert promise.status == PromiseStatus.BROKEN


def test_rejection_respects_the_touch_cap(db):
    """
    Rejecting a promise must not buy extra contact attempts. An invoice already at the
    cap gets escalated but no email, and the withheld decision is logged.
    """
    inv = make_invoice(
        db, "INV-REJECT-CAP",
        touch_count=settings.max_touches_per_invoice,
        last_touch_at=datetime(2026, 8, 1),
    )

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-REJECT-CAP",
            reply_text="We are trying to arrange funds and will pay soon."
        ),
        db=db
    )

    reject_res = reject_promise(promise_id=res["promise"]["id"], db=db)
    assert reject_res["email_sent"] is False
    assert reject_res["blocked_by"] == "max_touches_reached"

    db.refresh(inv)
    assert inv.touch_count == settings.max_touches_per_invoice  # not incremented

    blocked = db.query(ActionLog).filter(
        ActionLog.invoice_id == "INV-REJECT-CAP",
        ActionLog.rule_that_blocked == "max_touches_reached"
    ).first()
    assert blocked is not None


def test_payment_claim_pauses_instead_of_marking_paid(db):
    """FR21: only a verified webhook may reach PAID — a customer's word is not enough."""
    inv = make_invoice(db, "INV-CLAIM-1")

    res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-CLAIM-1",
            reply_text="I already paid this invoice yesterday via Razorpay UPI."
        ),
        db=db
    )

    assert res["status"] == InvoiceStatus.PENDING_VERIFICATION.value
    db.refresh(inv)
    assert inv.status == InvoiceStatus.PENDING_VERIFICATION
