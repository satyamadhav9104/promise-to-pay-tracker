"""
Promise-to-Pay Tracker — Main FastAPI Application entrypoint.
Razorpay AI Buildathon, Track 03: AI Revenue Recovery.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base import Base
from app.db.session import engine
from app.api.routes import invoices, promises, webhooks, audit

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Promise-to-Pay Tracker API",
    description="AI Revenue Recovery Agent for B2B Collections — Closed-loop promise tracking & verification.",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(invoices.router, prefix="/api")
app.include_router(promises.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(audit.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "Promise-to-Pay Tracker API",
        "track": "Track 03 — AI Revenue Recovery",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Production health check endpoint for ECS, Cloud Run, Render, and Docker health checks."""
    try:
        from app.db.session import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0"
    }

