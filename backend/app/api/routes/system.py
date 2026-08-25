"""
System routes: live guardrail settings and one-click demo seeding.

FR16-FR18 guardrails are configurable at runtime so the Settings page controls the
real engine rather than a copy in browser storage. Values are persisted in the
app_settings table and mirrored onto app.core.config.settings, which is what
check_touch_allowed and the confidence gate read.
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.app_setting import AppSetting
from app.models.invoice import Invoice
from app.schemas.invoice import GuardrailSettings, GuardrailSettingsUpdate
from app.services.demo_seed import seed_invoices

logger = logging.getLogger(__name__)

router = APIRouter(tags=["System"])

# key -> (attribute name, caster)
GUARDRAIL_KEYS = {
    "max_touches_per_invoice": ("max_touches_per_invoice", int),
    "cooldown_days_between_touches": ("cooldown_days_between_touches", int),
    "promise_confidence_threshold": ("promise_confidence_threshold", float),
}


def load_guardrails_from_db(db: Session) -> None:
    """
    Applies any persisted guardrail overrides onto the in-memory settings object.
    Called once at startup; environment values act as the defaults.
    """
    for row in db.query(AppSetting).all():
        mapping = GUARDRAIL_KEYS.get(row.key)
        if not mapping:
            continue
        attr, cast = mapping
        try:
            setattr(settings, attr, cast(row.value))
        except (TypeError, ValueError):
            logger.warning("Ignoring unparseable stored setting %s=%r", row.key, row.value)


def _current() -> GuardrailSettings:
    return GuardrailSettings(
        max_touches_per_invoice=settings.max_touches_per_invoice,
        cooldown_days_between_touches=settings.cooldown_days_between_touches,
        promise_confidence_threshold=settings.promise_confidence_threshold,
    )


@router.get("/settings", response_model=GuardrailSettings)
def get_guardrail_settings():
    """Returns the guardrails the engine is actually enforcing right now."""
    return _current()


@router.patch("/settings", response_model=GuardrailSettings)
def update_guardrail_settings(update: GuardrailSettingsUpdate, db: Session = Depends(get_db)):
    """
    Updates one or more guardrails. Takes effect on the next scheduler tick and on the
    next extraction — there is no separate copy of these numbers anywhere else.
    """
    changes = update.model_dump(exclude_none=True)

    for key, value in changes.items():
        attr, _cast = GUARDRAIL_KEYS[key]
        setattr(settings, attr, value)

        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(AppSetting(key=key, value=str(value)))

    if changes:
        db.commit()
        logger.info("Guardrails updated: %s", changes)

    return _current()


@router.post("/demo/seed")
def seed_demo_data(reset: bool = False, db: Session = Depends(get_db)):
    """
    Loads the 52-invoice synthetic dataset plus sample customer replies.

    Exists so a fresh clone can be populated from the dashboard's empty state — no
    terminal required. Pass reset=true to wipe existing invoices, promises and logs first.
    """
    created = seed_invoices(db, force_clean=reset)
    total = db.query(Invoice).count()

    if created:
        message = f"Loaded {created} demo invoices. Dashboard is ready."
    elif total:
        message = f"Demo data already present ({total} invoices). Pass reset=true to reload from scratch."
    else:
        message = "No demo fixture found on disk, so nothing was seeded."

    return {
        "success": True,
        "invoices_created": created,
        "total_invoices": total,
        "message": message,
    }
