"""Unit tests for Promise approval, rejection, and notification workflows."""
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.schemas.extraction import CustomerReplyInput
from app.api.routes.promises import extract_and_log_reply, approve_promise, reject_promise


def test_promise_proposal_and_approval_workflow():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    inv = Invoice(
        id="INV-APPROVE-1",
        customer_name="Acme Corp",
        customer_email="acme@example.com",
        amount=5000.0,
        due_date=datetime(2026, 8, 20),
        status=InvoiceStatus.OVERDUE,
        touch_count=0
    )
    db.add(inv)
    db.commit()

    reply_res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-APPROVE-1",
            reply_text="We will transfer the payment by 2026-08-30."
        ),
        db=db
    )

    assert "promise" in reply_res
    promise_id = reply_res["promise"]["id"]
    promise_in_db = db.query(Promise).filter(Promise.id == promise_id).first()
    assert promise_in_db is not None
    assert promise_in_db.status == PromiseStatus.FLAGGED_HUMAN_REVIEW

    approve_res = approve_promise(promise_id=promise_id, db=db)
    assert approve_res["status"] == "approved"

    db.refresh(inv)
    assert inv.status == InvoiceStatus.PROMISE_MADE
    assert inv.due_date.strftime("%Y-%m-%d") == "2026-08-30"
    assert promise_in_db.status == PromiseStatus.ACTIVE

    db.close()


def test_promise_rejection_workflow_sends_email():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    inv = Invoice(
        id="INV-REJECT-1",
        customer_name="Beta Logistics",
        customer_email="billing@betalogistics.com",
        amount=3200.0,
        due_date=datetime(2026, 8, 15),
        status=InvoiceStatus.OVERDUE,
        touch_count=1
    )
    db.add(inv)
    db.commit()

    reply_res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="INV-REJECT-1",
            reply_text="We might be able to pay by September 15, 2026."
        ),
        db=db
    )
    promise_id = reply_res["promise"]["id"]

    reject_res = reject_promise(promise_id=promise_id, db=db)
    assert reject_res["status"] == "rejected"

    db.refresh(inv)
    assert inv.status == InvoiceStatus.ESCALATED
    assert inv.touch_count == 2
    assert inv.last_touch_at is not None

    promise_in_db = db.query(Promise).filter(Promise.id == promise_id).first()
    assert promise_in_db.status == PromiseStatus.BROKEN

    db.close()
