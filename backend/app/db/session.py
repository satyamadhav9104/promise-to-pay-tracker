"""Database session management with SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Enable check_same_thread=False for SQLite
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for obtaining DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
