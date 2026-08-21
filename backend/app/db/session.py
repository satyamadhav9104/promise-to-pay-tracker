"""Database session management with SQLAlchemy for MySQL and SQLite."""
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


def ensure_database_exists(url_str: str):
    """Automatically creates MySQL database if it does not already exist."""
    if url_str.startswith("mysql"):
        try:
            import pymysql
            parsed = urlparse(url_str)
            db_name = parsed.path.lstrip("/")
            if db_name:
                user = parsed.username or "root"
                password = parsed.password or ""
                host = parsed.hostname or "localhost"
                port = parsed.port or 3306

                conn = pymysql.connect(
                    host=host,
                    user=user,
                    password=password,
                    port=port
                )
                with conn.cursor() as cursor:
                    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"[DB] Automatic database creation check note: {e}")


# Ensure DB exists before engine initialization
ensure_database_exists(settings.database_url)

is_sqlite = settings.database_url.startswith("sqlite")

# Enable check_same_thread=False for SQLite
engine_kwargs = {}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # MySQL / PostgreSQL connection pooling optimization
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(
    settings.database_url,
    echo=False,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for obtaining DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
