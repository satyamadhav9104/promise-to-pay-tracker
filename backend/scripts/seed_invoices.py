"""
Database seed script.
Populates SQLite database with 50+ synthetic B2B invoices and initial sample promises/logs.
"""
import os
import json
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.schemas.extraction import CustomerReplyInput
from app.api.routes.promises import extract_and_log_reply


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing tables
        db.query(ActionLog).delete()
        db.query(Promise).delete()
        db.query(Invoice).delete()
        db.commit()

        fixtures_dir = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures")
        invoices_file = os.path.join(fixtures_dir, "synthetic_invoices.json")

        with open(invoices_file, "r") as f:
            invoices_data = json.load(f)

        invoices_created = 0
        for data in invoices_data:
            inv = Invoice(
                id=data["id"],
                customer_name=data["customer_name"],
                amount=data["amount"],
                due_date=datetime.fromisoformat(data["due_date"]),
                created_date=datetime.fromisoformat(data["created_date"]),
                status=InvoiceStatus(data["status"]),
                touch_count=0,
                last_touch_at=None
            )
            db.add(inv)
            invoices_created += 1

        db.commit()
        print(f"Successfully seeded {invoices_created} synthetic invoices into database.")

        # Seed sample promises/replies for demo
        sample_replies = [
            ("INV-1001", "We will process payment for invoice INV-1001 by 2026-09-01."),
            ("INV-1003", "I already paid this invoice yesterday via Razorpay UPI. Reference ID #RP192837."),
            ("INV-1004", "We are currently reviewing our cash flow and will try to pay soon."),
            ("INV-1006", "Sorry for the delay! We will transfer the funds tomorrow morning."),
        ]

        for inv_id, reply_text in sample_replies:
            extract_and_log_reply(
                input_data=CustomerReplyInput(invoice_id=inv_id, reply_text=reply_text),
                db=db
            )

        print("Successfully processed sample customer replies and promises.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
