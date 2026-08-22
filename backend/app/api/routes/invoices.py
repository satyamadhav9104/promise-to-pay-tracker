"""FastAPI routes for invoice query, detail, metrics, and dataset seeding."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.promise import Promise, PromiseStatus
from app.models.action_log import ActionLog
from app.schemas.invoice import InvoiceResponse, MetricsResponse, InvoiceCreate
import uuid

from app.services.notifier import send_notification
from app.core.rules import Channel

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(
    invoice_in: InvoiceCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    """Creates a new B2B invoice in the database."""
    existing = db.query(Invoice).filter(Invoice.id == invoice_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Invoice with ID '{invoice_in.id}' already exists.")

    now = datetime.utcnow()
    due_dt = invoice_in.due_date.replace(tzinfo=None) if invoice_in.due_date.tzinfo else invoice_in.due_date
    status = InvoiceStatus.OVERDUE if due_dt < now else InvoiceStatus.CREATED

    invoice = Invoice(
        id=invoice_in.id,
        user_id=invoice_in.user_id or x_user_id,
        customer_name=invoice_in.customer_name,
        customer_email=invoice_in.customer_email,
        invoice_type=getattr(invoice_in, 'invoice_type', None) or "receivable",
        amount=invoice_in.amount,
        due_date=due_dt,
        created_date=now,
        status=status,
        touch_count=0,
        last_touch_at=None
    )
    db.add(invoice)

    log_entry = ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        timestamp=now,
        trigger="manual_invoice_creation",
        action_taken="invoice_created",
        rule_applied="initial_ingestion",
        actor="user",
        detail=f"Created invoice {invoice.id} for {invoice.customer_name} (${invoice.amount:,.2f}). Status: {status.value}."
    )
    db.add(log_entry)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/clear-all")
def clear_all_invoices(db: Session = Depends(get_db)):
    """Wipes all invoices, promises, and action logs from database for a clean state."""
    db.query(ActionLog).delete()
    db.query(Promise).delete()
    db.query(Invoice).delete()
    db.commit()
    return {"message": "All invoices, promises, and audit logs cleared successfully. Database is clean."}


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Deletes a single invoice by ID from the database."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found.")

    db.delete(invoice)
    db.commit()
    return {"message": f"Invoice '{invoice_id}' deleted successfully."}


@router.post("/{invoice_id}/send-email")
def send_invoice_email(invoice_id: str, db: Session = Depends(get_db)):
    """Triggers automated email notification for an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found.")

    invoice.touch_count += 1
    invoice.last_touch_at = datetime.utcnow()

    due_str = invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else "N/A"
    recipient = getattr(invoice, 'customer_email', None) or f"{invoice.customer_name.lower().replace(' ', '.')}@example.com"

    result = send_notification(
        customer_name=invoice.customer_name,
        channel=Channel.EMAIL,
        touch_number=invoice.touch_count,
        amount=invoice.amount,
        due_date_str=due_str,
        recipient_email=recipient
    )

    log_entry = ActionLog(
        id=str(uuid.uuid4()),
        invoice_id=invoice.id,
        timestamp=datetime.utcnow(),
        trigger="user_manual_nudge",
        action_taken="email_sent",
        rule_applied="outbound_notification",
        actor="user",
        detail=f"Automated email dispatched to {recipient}. Provider: {result.get('provider', 'smtp')}. Subject: {result.get('subject', 'Payment Reminder')}"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(invoice)

    return {
        "message": f"Automated email sent to {recipient}!",
        "recipient": recipient,
        "touch_count": invoice.touch_count,
        "email_details": result
    }


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[InvoiceStatus] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    """Lists invoices with optional status and user_id multi-tenancy filter."""
    query = db.query(Invoice)
    if x_user_id:
        query = query.filter(Invoice.user_id == x_user_id)
    if status:
        query = query.filter(Invoice.status == status)
    return query.order_by(Invoice.due_date.asc()).offset(offset).limit(limit).all()



@router.get("/metrics/summary", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    """
    FR30: Computes summary recovery metrics across the invoice batch.
    """
    total_invoices = db.query(Invoice).count()
    if total_invoices == 0:
        return MetricsResponse(
            total_invoices=0,
            total_amount=0.0,
            total_recovered_amount=0.0,
            recovery_rate_percentage=0.0,
            avg_days_to_recovery=0.0,
            promises_kept_count=0,
            promises_broken_count=0,
            human_escalations_count=0
        )

    total_amount = db.query(func.sum(Invoice.amount)).scalar() or 0.0
    paid_invoices = db.query(Invoice).filter(Invoice.status == InvoiceStatus.PAID).all()
    total_recovered_amount = sum(inv.amount for inv in paid_invoices)
    recovery_rate = (total_recovered_amount / total_amount * 100.0) if total_amount > 0 else 0.0

    # Calculate average days to recovery for paid invoices
    days_list = []
    for inv in paid_invoices:
        # Find payment action log
        paid_log = db.query(ActionLog).filter(
            ActionLog.invoice_id == inv.id,
            ActionLog.action_taken == "status_changed:pending_verification->paid"
        ).first()
        if not paid_log:
            paid_log = db.query(ActionLog).filter(
                ActionLog.invoice_id == inv.id,
                ActionLog.action_taken.like("%->paid%")
            ).first()

        if paid_log and paid_log.timestamp:
            days = (paid_log.timestamp - inv.created_date).total_seconds() / 86400.0
            days_list.append(max(days, 0.0))

    avg_days = sum(days_list) / len(days_list) if days_list else 0.0

    promises_kept = db.query(Promise).filter(Promise.status == PromiseStatus.KEPT).count()
    promises_broken = db.query(Promise).filter(Promise.status == PromiseStatus.BROKEN).count()
    human_escalations = db.query(Invoice).filter(Invoice.status == InvoiceStatus.ESCALATED).count()

    return MetricsResponse(
        total_invoices=total_invoices,
        total_amount=round(total_amount, 2),
        total_recovered_amount=round(total_recovered_amount, 2),
        recovery_rate_percentage=round(recovery_rate, 2),
        avg_days_to_recovery=round(avg_days, 1),
        promises_kept_count=promises_kept,
        promises_broken_count=promises_broken,
        human_escalations_count=human_escalations
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_detail(invoice_id: str, db: Session = Depends(get_db)):
    """Retrieves a single invoice by ID."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")
    return invoice
