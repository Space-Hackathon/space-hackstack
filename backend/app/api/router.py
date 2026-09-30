from fastapi import APIRouter

from app.api.routes import files, health, ml, processors

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(files.router)
api_router.include_router(processors.router)
api_router.include_router(ml.router)
