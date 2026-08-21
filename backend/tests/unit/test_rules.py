"""Unit tests for business escalation rules, touch caps, and cooldown enforcement."""
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.models.action_log import ActionLog
from app.core.rules import next_channel, Channel
from app.scheduler.tick import run_scheduler_tick


def test_escalation_ladder_channels():
    assert next_channel(0) == Channel.EMAIL
    assert next_channel(1) == Channel.EMAIL
    assert next_channel(2) == Channel.WHATSAPP
    assert next_channel(3) is None


def test_cooldown_and_touch_cap_in_scheduler():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    inv = Invoice(
        id="RULE-101",
        customer_name="Rule Test Customer",
        amount=5000.0,
        due_date=datetime.utcnow() - timedelta(days=5),
        status=InvoiceStatus.OVERDUE,
        touch_count=0,
        last_touch_at=None
    )
    db.add(inv)
    db.commit()

    now = datetime.utcnow()

    # Tick 1: Should execute touch 1 (email)
    res1 = run_scheduler_tick(db, now=now)
    assert len(res1) == 1
    assert res1[0]["action"] == "sent_email"
    assert inv.touch_count == 1

    # Tick 2 immediate: Should be blocked by cooldown (4 days default)
    res2 = run_scheduler_tick(db, now=now + timedelta(hours=1))
    assert len(res2) == 1
    assert res2[0]["action"] == "no_op"
    assert res2[0]["reason"] == "cooldown_active"
    assert inv.touch_count == 1

    # Tick 3 (after 5 days): Should execute touch 2 (email)
    now_touch2 = now + timedelta(days=5)
    res3 = run_scheduler_tick(db, now=now_touch2)
    assert res3[0]["action"] == "sent_email"
    assert inv.touch_count == 2

    # Tick 4 (after 10 days): Should execute touch 3 (whatsapp)
    now_touch3 = now + timedelta(days=10)
    res4 = run_scheduler_tick(db, now=now_touch3)
    assert res4[0]["action"] == "sent_whatsapp"
    assert inv.touch_count == 3

    # Tick 5 (after 15 days): Touch cap hit (3 touches), status becomes ESCALATED
    now_touch4 = now + timedelta(days=15)
    res5 = run_scheduler_tick(db, now=now_touch4)
    assert res5[0]["action"] == "no_op"
    assert res5[0]["reason"] == "max_touches_reached"
    assert inv.status == InvoiceStatus.ESCALATED

    db.close()
