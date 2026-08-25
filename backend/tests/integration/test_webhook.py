"""Integration tests for the Razorpay webhook endpoint and payment resolution."""
import json
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.action_log import ActionLog
from app.models.invoice import Invoice, InvoiceStatus
from app.services.razorpay_client import sign_webhook_payload

# Setup shared in-memory test DB for TestClient
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

TEST_SECRET = "whsec_test_abc123"


def make_invoice(invoice_id):
    db = TestingSessionLocal()
    db.add(Invoice(
        id=invoice_id,
        customer_name="Webhook Test Inc",
        amount=3500.0,
        due_date=datetime.now(timezone.utc).replace(tzinfo=None),
        status=InvoiceStatus.OVERDUE
    ))
    db.commit()
    db.close()


def captured_payload(invoice_id, payment_id):
    return {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "amount": 350000,
                    "currency": "INR",
                    "notes": {"invoice_id": invoice_id}
                }
            }
        }
    }


def post_webhook(payload, signature=None):
    """Posts the exact bytes we signed — re-serialising would change the digest."""
    body = json.dumps(payload)
    headers = {"Content-Type": "application/json"}
    if signature is not None:
        headers["X-Razorpay-Signature"] = signature
    return client.post("/api/webhooks/razorpay", content=body, headers=headers)


def status_of(invoice_id):
    db = TestingSessionLocal()
    try:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        return inv.status if inv else None
    finally:
        db.close()


@pytest.fixture
def secret_configured(monkeypatch):
    """A server that has a webhook secret must actually enforce it."""
    monkeypatch.setattr(settings, "razorpay_webhook_secret", TEST_SECRET)
    yield TEST_SECRET


def test_valid_signature_marks_invoice_paid(secret_configured):
    make_invoice("WEBHOOK-VALID")
    payload = captured_payload("WEBHOOK-VALID", "pay_valid_001")
    body = json.dumps(payload)

    response = post_webhook(payload, signature=sign_webhook_payload(body, secret_configured))

    assert response.status_code == 200
    assert response.json()["new_status"] == "paid"
    assert response.json()["signature_verified"] is True
    assert status_of("WEBHOOK-VALID") == InvoiceStatus.PAID


def test_forged_signature_cannot_close_an_invoice(secret_configured):
    make_invoice("WEBHOOK-FORGED")

    response = post_webhook(captured_payload("WEBHOOK-FORGED", "pay_forged_001"), signature="0" * 64)

    assert response.status_code == 400
    assert status_of("WEBHOOK-FORGED") == InvoiceStatus.OVERDUE


def test_missing_signature_is_rejected_when_a_secret_is_configured(secret_configured):
    """
    The header being absent must not skip the check — otherwise omitting it is
    enough to mark any invoice PAID.
    """
    make_invoice("WEBHOOK-NOSIG")

    response = post_webhook(captured_payload("WEBHOOK-NOSIG", "pay_nosig_001"))

    assert response.status_code == 400
    assert status_of("WEBHOOK-NOSIG") == InvoiceStatus.OVERDUE


def test_signature_covers_the_body(secret_configured):
    """A signature valid for one payload must not authorise a different one."""
    make_invoice("WEBHOOK-SWAP")
    signature_for_other_body = sign_webhook_payload(
        json.dumps(captured_payload("WEBHOOK-SWAP", "pay_original")), secret_configured
    )

    response = post_webhook(
        captured_payload("WEBHOOK-SWAP", "pay_tampered"),
        signature=signature_for_other_body
    )

    assert response.status_code == 400
    assert status_of("WEBHOOK-SWAP") == InvoiceStatus.OVERDUE


def test_replayed_payment_is_idempotent(secret_configured):
    make_invoice("WEBHOOK-REPLAY")
    payload = captured_payload("WEBHOOK-REPLAY", "pay_replay_001")
    signature = sign_webhook_payload(json.dumps(payload), secret_configured)

    first = post_webhook(payload, signature=signature)
    second = post_webhook(payload, signature=signature)

    assert first.status_code == 200
    assert second.status_code == 200
    assert "idempotent" in second.json()["message"].lower()

    # Exactly one PAID transition was recorded, not two.
    db = TestingSessionLocal()
    try:
        paid_rows = db.query(ActionLog).filter(
            ActionLog.invoice_id == "WEBHOOK-REPLAY",
            ActionLog.action_taken.like("%paid%")
        ).count()
    finally:
        db.close()
    assert paid_rows == 1


def test_without_a_secret_the_event_is_accepted_but_logged_as_unverified(monkeypatch):
    """
    A local clone with no secret still needs to demo the flow, so the event is
    accepted — but the audit trail must never claim it was verified.
    """
    monkeypatch.setattr(settings, "razorpay_webhook_secret", "")
    make_invoice("WEBHOOK-NOSECRET")

    response = post_webhook(captured_payload("WEBHOOK-NOSECRET", "pay_nosecret_001"))

    assert response.status_code == 200
    assert response.json()["new_status"] == "paid"
    assert response.json()["signature_verified"] is False

    db = TestingSessionLocal()
    try:
        rows = db.query(ActionLog).filter(ActionLog.invoice_id == "WEBHOOK-NOSECRET").all()
        details = " ".join((r.detail or "") for r in rows)
        rules = " ".join((r.rule_applied or "") for r in rows)
    finally:
        db.close()

    assert "NOT verified" in details
    assert "unverified" in rules
