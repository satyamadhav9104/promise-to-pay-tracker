"""
Demo dataset seeding.

Shared by the CLI script (scripts/seed_invoices.py) and the POST /api/demo/seed
endpoint, so a judge cloning the repo can populate the dashboard from the browser
without ever opening a terminal.
"""
import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog

logger = logging.getLogger(__name__)

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXTURES_PATH = os.path.join(BACKEND_ROOT, "tests", "fixtures", "synthetic_invoices.json")

# Replies chosen so the seeded dashboard exercises every branch of the agent:
# a confident dated promise (auto-accepted), an unverified payment claim (paused
# pending Razorpay), a vague promise (routed to a human), and a relative-date promise.
SAMPLE_REPLIES: List[Tuple[str, str]] = [
    ("INV-1001", "We will process payment for invoice INV-1001 by 2026-09-01."),
    ("INV-1003", "I already paid this invoice yesterday via Razorpay UPI. Reference ID #RP192837."),
    ("INV-1004", "We are currently reviewing our cash flow and will try to pay soon."),
    ("INV-1006", "Sorry for the delay! We will transfer the funds tomorrow morning."),
]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _derive_email(customer_name: str) -> str:
    clean = customer_name.lower().replace(" ", "").replace("&", "").replace(",", "")
    return f"billing@{clean}.com"


def _derive_invoice_type(invoice_id: str, customer_name: str) -> str:
    numeric = "".join(ch for ch in invoice_id if ch.isdigit())
    is_payable = (
        "Corp" in customer_name
        or "Solutions" in customer_name
        or (numeric and int(numeric) % 4 == 0)
    )
    return "payable" if is_payable else "receivable"


def load_fixture_invoices() -> List[Dict]:
    """Reads the 52-invoice synthetic dataset. Returns [] when the fixture is missing."""
    if not os.path.exists(FIXTURES_PATH):
        logger.warning("Seed fixture not found at %s", FIXTURES_PATH)
        return []
    with open(FIXTURES_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def seed_invoices(db: Session, force_clean: bool = False, with_replies: bool = True) -> int:
    """
    Seeds synthetic B2B invoices plus a handful of customer replies.

    Returns the number of invoices created. Existing ids are skipped, so calling this
    twice is safe.
    """
    if force_clean:
        db.query(ActionLog).delete()
        db.query(Promise).delete()
        db.query(Invoice).delete()
        db.commit()

    invoices_data = load_fixture_invoices()
    if not invoices_data:
        return 0

    now = _utc_now()
    invoices_created = 0

    for data in invoices_data:
        if db.query(Invoice).filter(Invoice.id == data["id"]).first():
            continue

        customer_name = data.get("customer_name", "B2B Client")
        status_enum = InvoiceStatus(data.get("status", "created"))

        if status_enum in (InvoiceStatus.OVERDUE, InvoiceStatus.DUE_SOON, InvoiceStatus.PROMISE_MADE):
            touch_count = 1
        elif status_enum == InvoiceStatus.ESCALATED:
            touch_count = 3
        else:
            touch_count = 0

        last_touch_at = (
            now - timedelta(days=2)
            if status_enum in (InvoiceStatus.OVERDUE, InvoiceStatus.ESCALATED)
            else None
        )

        invoice = Invoice(
            id=data["id"],
            customer_name=customer_name,
            customer_email=_derive_email(customer_name),
            invoice_type=_derive_invoice_type(data["id"], customer_name),
            amount=float(data.get("amount", 5000.0)),
            due_date=datetime.fromisoformat(data["due_date"]),
            created_date=datetime.fromisoformat(data["created_date"]),
            status=status_enum,
            touch_count=touch_count,
            last_touch_at=last_touch_at,
        )
        db.add(invoice)
        invoices_created += 1

        db.add(ActionLog(
            id=str(uuid.uuid4()),
            invoice_id=invoice.id,
            timestamp=invoice.created_date,
            trigger="system_ingestion",
            action_taken="invoice_created",
            rule_applied="initial_ingestion",
            actor="system",
            detail=(
                f"Ingested B2B invoice {invoice.id} for {invoice.customer_name} "
                f"(${invoice.amount:,.2f}), due {invoice.due_date.strftime('%Y-%m-%d')}."
            ),
        ))

    db.commit()

    if with_replies:
        _seed_sample_replies(db)

    return invoices_created


def _seed_sample_replies(db: Session) -> None:
    """Runs a few customer replies through the real extraction route."""
    # Imported lazily: the route module pulls in the LLM extractor and notifier, and
    # this function is only reached when seeding.
    from app.schemas.extraction import CustomerReplyInput
    from app.api.routes.promises import extract_and_log_reply

    for invoice_id, reply_text in SAMPLE_REPLIES:
        if not db.query(Invoice).filter(Invoice.id == invoice_id).first():
            continue
        if db.query(Promise).filter(Promise.invoice_id == invoice_id).first():
            continue
        try:
            extract_and_log_reply(
                input_data=CustomerReplyInput(invoice_id=invoice_id, reply_text=reply_text),
                db=db,
            )
        except Exception as exc:
            db.rollback()
            logger.warning("Sample reply for %s could not be seeded: %s", invoice_id, exc)


def seed_database_if_empty(db: Session) -> int:
    """Seeds only when the database has no invoices. Returns the resulting invoice count."""
    count = db.query(Invoice).count()
    if count > 0:
        return count
    seed_invoices(db, force_clean=False)
    return db.query(Invoice).count()
