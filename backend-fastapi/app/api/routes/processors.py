from fastapi import APIRouter

from app.processors import all_processors

router = APIRouter(prefix="/processors", tags=["processors"])


@router.get("")
def list_processors() -> list[dict]:
    return [
        {"name": p.name, "description": p.description, "extensions": list(p.extensions)}
        for p in all_processors()
    ]
