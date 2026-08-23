"""Integration tests for Razorpay Webhook endpoint and payment resolution."""
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus

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


def test_razorpay_webhook_captured_event():
    db = TestingSessionLocal()
    inv = Invoice(
        id="WEBHOOK-101",
        customer_name="Webhook Test Inc",
        amount=3500.0,
        due_date=datetime.now(timezone.utc).replace(tzinfo=None),
        status=InvoiceStatus.OVERDUE
    )

    db.add(inv)
    db.commit()
    db.close()

    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_888",
                    "amount": 350000,
                    "currency": "INR",
                    "notes": {
                        "invoice_id": "WEBHOOK-101"
                    }
                }
            }
        }
    }

    response = client.post("/api/webhooks/razorpay", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["new_status"] == "paid"

    # Verify DB state
    db = TestingSessionLocal()
    updated_inv = db.query(Invoice).filter(Invoice.id == "WEBHOOK-101").first()
    assert updated_inv.status == InvoiceStatus.PAID
    db.close()
