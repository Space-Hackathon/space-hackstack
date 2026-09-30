from fastapi import APIRouter, Depends
from sqlmodel import Session, text

from app.core.config import get_settings
from app.core.database import get_session

router = APIRouter(tags=["health"])


@router.get("/health")
def health(session: Session = Depends(get_session)) -> dict:
    try:
        session.exec(text("SELECT 1"))
        db_status = "ok"
    except Exception:  # noqa: BLE001
        db_status = "error"
    settings = get_settings()
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "app": settings.app_name,
        "environment": settings.environment,
        "database": db_status,
    }
