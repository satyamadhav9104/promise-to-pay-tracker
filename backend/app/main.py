"""
Promise-to-Pay Tracker — Main FastAPI Application entrypoint.
Razorpay AI Buildathon, Track 03: AI Revenue Recovery.
Hardened Production Architecture with Lifespan Scheduler & Rate Limiting.
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.db.base import Base
from app.db.session import engine, SessionLocal, get_db
from app.api.routes import invoices, promises, webhooks, audit, rag, razorpay
from app.scheduler.tick import run_scheduler_tick

logger = logging.getLogger("smartinvoice")
logging.basicConfig(level=logging.INFO)

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

# Background Periodic Recovery Task
async def periodic_scheduler_worker():
    """Runs automated recovery ticks periodically in the background."""
    logger.info("[SCHEDULER WORKER] Background recovery scheduler worker started.")
    while True:
        try:
            await asyncio.sleep(300)  # Check every 5 minutes
            db = SessionLocal()
            try:
                results = run_scheduler_tick(db)
                if results:
                    logger.info(f"[SCHEDULER TICK] Executed periodic sweep: {len(results)} actions evaluated.")
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("[SCHEDULER WORKER] Background scheduler worker received cancellation.")
            break
        except Exception as e:
            logger.error(f"[SCHEDULER WORKER ERROR] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database table setup and background workers."""
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Start background scheduler
    task = asyncio.create_task(periodic_scheduler_worker())
    yield
    # Graceful shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="SmartInvoice (Promise-to-Pay Tracker API)",
    description="Enterprise AI Revenue Recovery Agent — Closed-loop promise tracking, Razorpay checkout & automated recovery.",
    version="1.2.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
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
app.include_router(rag.router, prefix="/api")
app.include_router(razorpay.router, prefix="/api")


@app.post("/api/scheduler/tick", tags=["Scheduler Engine"])
def trigger_scheduler_tick(db: Session = Depends(get_db)):
    """
    Triggers an on-demand scheduler sweep across all active invoices.
    Evaluates cooldowns, touch caps, and broken promises.
    """
    results = run_scheduler_tick(db)
    return {
        "success": True,
        "evaluated_actions_count": len(results),
        "results": results
    }


@app.get("/api/info")
def api_info():
    return {
        "app": "SmartInvoice — Promise-to-Pay Tracker API",
        "track": "Track 03 — AI Revenue Recovery",
        "version": "1.2.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Production health check endpoint for ECS, Cloud Run, Render, and Kubernetes health checks."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.2.0"
    }



# Mount built React frontend static files for Heroku / Production
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_dir = os.path.abspath(os.path.join(base_dir, "..", "frontend", "dist"))
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path in ["health", "docs", "openapi.json"]:
            return {"error": "Not Found"}
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

