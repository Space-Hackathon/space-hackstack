from fastapi import APIRouter
from app.core.config import get_settings
from app.processors import all_processors

router = APIRouter(tags=["capabilities"])

@router.get("/capabilities")
def capabilities() -> dict:
    settings = get_settings()
    return {
        "contract_version": "1",
        "max_upload_bytes": settings.max_upload_mb * 1024 * 1024,
        "processors": [
            {"name": p.name, "description": p.description, "extensions": list(p.extensions)}
            for p in all_processors()
        ],
        "features": {"files": True, "processing": True, "inference": True},
    }
