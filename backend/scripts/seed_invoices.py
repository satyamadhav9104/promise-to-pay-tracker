"""
Database seed script.
Populates MySQL / SQLite database with 52 synthetic B2B invoices and initial sample promises/logs.
"""
import os
import json
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.schemas.extraction import CustomerReplyInput
from app.api.routes.promises import extract_and_log_reply


def ensure_mysql_database_exists():
    """Helper to execute CREATE DATABASE IF NOT EXISTS for MySQL before engine connects."""
    if "mysql" in settings.database_url:
        try:
            import pymysql
            connection = pymysql.connect(
                host="localhost",
                user="root",
                password="123456789",
                port=3306
            )
            with connection.cursor() as cursor:
                cursor.execute("CREATE DATABASE IF NOT EXISTS promise_to_pay_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            connection.commit()
            connection.close()
            print("MySQL database 'promise_to_pay_db' is ready.")
        except Exception as e:
            print(f"Database pre-creation check note: {e}")


def seed_invoices(db: Session, force_clean: bool = False) -> int:
    """Seeds the database with synthetic B2B invoices and initial promises/logs."""
    if force_clean:
        db.query(ActionLog).delete()
        db.query(Promise).delete()
        db.query(Invoice).delete()
        db.commit()

    fixtures_dir = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures")
    invoices_file = os.path.join(fixtures_dir, "synthetic_invoices.json")

    if not os.path.exists(invoices_file):
        return 0

    with open(invoices_file, "r", encoding="utf-8") as f:
        invoices_data = json.load(f)

    now = datetime.utcnow()
    invoices_created = 0
    for data in invoices_data:
        existing = db.query(Invoice).filter(Invoice.id == data["id"]).first()
        if existing:
            continue

        cust_name = data.get("customer_name", "B2B Client")
        clean_name = cust_name.lower().replace(" ", "").replace("&", "").replace(",", "")
        email = f"billing@{clean_name}.com"
        status_enum = InvoiceStatus(data.get("status", "created"))

        inv = Invoice(
            id=data["id"],
            customer_name=cust_name,
            customer_email=email,
            invoice_type="payable" if ("Corp" in cust_name or "Solutions" in cust_name or int(data["id"].replace("INV-", "")) % 4 == 0) else "receivable",
            amount=float(data.get("amount", 5000.0)),
            due_date=datetime.fromisoformat(data["due_date"]),
            created_date=datetime.fromisoformat(data["created_date"]),
            status=status_enum,
            touch_count=1 if status_enum in (InvoiceStatus.OVERDUE, InvoiceStatus.DUE_SOON, InvoiceStatus.PROMISE_MADE) else (3 if status_enum == InvoiceStatus.ESCALATED else 0),
            last_touch_at=now - timedelta(days=2) if status_enum in (InvoiceStatus.OVERDUE, InvoiceStatus.ESCALATED) else None
        )
        db.add(inv)
        invoices_created += 1

        log_entry = ActionLog(
            id=str(uuid.uuid4()),
            invoice_id=inv.id,
            timestamp=inv.created_date,
            trigger="system_ingestion",
            action_taken="invoice_created",
            rule_applied="initial_ingestion",
            actor="system",
            detail=f"Ingested B2B invoice {inv.id} for {inv.customer_name} (${inv.amount:,.2f}). Status: {inv.status.value}."
        )
        db.add(log_entry)

    db.commit()

    # Seed sample customer promises for active demo review
    sample_replies = [
        ("INV-1001", "We will process payment for invoice INV-1001 by 2026-09-01."),
        ("INV-1003", "I already paid this invoice yesterday via Razorpay UPI. Reference ID #RP192837."),
        ("INV-1004", "We are currently reviewing our cash flow and will try to pay soon."),
        ("INV-1006", "Sorry for the delay! We will transfer the funds tomorrow morning."),
    ]

    for inv_id, reply_text in sample_replies:
        if not db.query(Promise).filter(Promise.invoice_id == inv_id).first():
            try:
                extract_and_log_reply(
                    input_data=CustomerReplyInput(invoice_id=inv_id, reply_text=reply_text),
                    db=db
                )
            except Exception as e:
                print(f"Sample reply note ({inv_id}): {e}")

    return invoices_created


def seed_database_if_empty(db: Session) -> int:
    """Seeds the database only if there are currently 0 invoices."""
    count = db.query(Invoice).count()
    if count > 0:
        return count
    return seed_invoices(db, force_clean=False)


def seed():
    ensure_mysql_database_exists()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = seed_invoices(db, force_clean=True)
        print(f"Successfully seeded {count} synthetic invoices into database.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

