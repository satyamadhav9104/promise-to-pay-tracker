"""Unit tests for Invoice State Machine and transition invariants."""
import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.invoice import Invoice, InvoiceStatus
from app.services.state_machine import transition_invoice_status, InvalidStateTransitionError


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_valid_state_transitions(db_session):
    inv = Invoice(
        id="TEST-101",
        customer_name="Test Corp",
        amount=1000.0,
        due_date=datetime.utcnow(),
        status=InvoiceStatus.CREATED
    )
    db_session.add(inv)
    db_session.commit()

    # CREATED -> OVERDUE
    inv = transition_invoice_status(db_session, inv, InvoiceStatus.OVERDUE, trigger="test")
    assert inv.status == InvoiceStatus.OVERDUE

    # OVERDUE -> PROMISE_MADE
    inv = transition_invoice_status(db_session, inv, InvoiceStatus.PROMISE_MADE, trigger="test")
    assert inv.status == InvoiceStatus.PROMISE_MADE

    # PROMISE_MADE -> PENDING_VERIFICATION
    inv = transition_invoice_status(db_session, inv, InvoiceStatus.PENDING_VERIFICATION, trigger="test")
    assert inv.status == InvoiceStatus.PENDING_VERIFICATION

    # PENDING_VERIFICATION -> PAID
    inv = transition_invoice_status(db_session, inv, InvoiceStatus.PAID, trigger="test")
    assert inv.status == InvoiceStatus.PAID


def test_invalid_state_transition_raises_error(db_session):
    inv = Invoice(
        id="TEST-102",
        customer_name="Test Corp",
        amount=1000.0,
        due_date=datetime.utcnow(),
        status=InvoiceStatus.CREATED
    )
    db_session.add(inv)
    db_session.commit()

    # CREATED -> PROMISE_DUE is invalid directly
    with pytest.raises(InvalidStateTransitionError):
        transition_invoice_status(db_session, inv, InvoiceStatus.PROMISE_DUE, trigger="test")


def test_terminal_paid_state_immutability(db_session):
    inv = Invoice(
        id="TEST-103",
        customer_name="Test Corp",
        amount=1000.0,
        due_date=datetime.utcnow(),
        status=InvoiceStatus.PAID
    )
    db_session.add(inv)
    db_session.commit()

    with pytest.raises(InvalidStateTransitionError):
        transition_invoice_status(db_session, inv, InvoiceStatus.OVERDUE, trigger="test")
