"""
Database seed script.

Populates the configured database (SQLite by default) with 52 synthetic B2B invoices
plus a few customer replies. The actual seeding logic lives in
app/services/demo_seed.py so that the CLI and POST /api/demo/seed stay in sync.

Usage:
    python scripts/seed_invoices.py            # wipe and reseed
    python scripts/seed_invoices.py --if-empty  # only seed an empty database
"""
import os
import sys

# Add the backend root to sys.path so `app.*` imports resolve when run directly.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.invoice import Invoice
from app.services.demo_seed import seed_invoices, seed_database_if_empty


def seed(if_empty: bool = False) -> int:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if if_empty:
            total = seed_database_if_empty(db)
            print(f"Database contains {total} invoices.")
            return total

        created = seed_invoices(db, force_clean=True)
        total = db.query(Invoice).count()
        print(f"Seeded {created} synthetic invoices ({total} total in database).")
        return created
    except Exception as exc:
        db.rollback()
        print(f"Error seeding database: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed(if_empty="--if-empty" in sys.argv)
