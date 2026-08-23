"""
Integration test for Race Condition prevention.
Verifies that customer claims ("I already paid") pause automated actions (pending_verification),
and ONLY actual payment webhooks/verification transition the invoice to PAID.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.extraction import CustomerReplyInput
from app.api.routes.promises import extract_and_log_reply
from app.api.routes.webhooks import simulate_payment, PaymentSimulateInput
from app.scheduler.tick import run_scheduler_tick


def test_race_condition_unverified_claim_pauses_scheduler_until_webhook():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Setup overdue invoice
    inv = Invoice(
        id="RACE-101",
        customer_name="Race Condition Corp",
        amount=7500.0,
        due_date=now_utc - timedelta(days=2),
        status=InvoiceStatus.OVERDUE,
        touch_count=0
    )
    db.add(inv)
    db.commit()

    # 2. Customer replies claiming payment ("I already paid yesterday")
    reply_res = extract_and_log_reply(
        input_data=CustomerReplyInput(
            invoice_id="RACE-101",
            reply_text="I already paid this invoice yesterday via bank transfer."
        ),
        db=db
    )

    # Assert status is PENDING_VERIFICATION (FR21), NOT PAID
    assert inv.status == InvoiceStatus.PENDING_VERIFICATION
    assert inv.status != InvoiceStatus.PAID

    # 3. Scheduler runs — outbound actions MUST be paused (FR22)
    tick_res = run_scheduler_tick(db, now=now_utc + timedelta(days=1))
    assert len(tick_res) == 1
    assert tick_res[0]["action"] == "no_op"
    assert tick_res[0]["reason"] == "pending_verification_pause"
    assert inv.touch_count == 0  # No touch count incremented!

    # 4. Real/Simulated payment webhook fires (FR23)
    pay_res = simulate_payment(
        input_data=PaymentSimulateInput(invoice_id="RACE-101", payment_id="pay_verified_999"),
        db=db
    )

    # Assert invoice is NOW PAID
    assert inv.status == InvoiceStatus.PAID

    # 5. Subsequent scheduler runs ignore paid invoice (FR13)
    tick_res2 = run_scheduler_tick(db, now=now_utc + timedelta(days=2))
    assert len(tick_res2) == 0  # Structurally excluded from query


    db.close()
