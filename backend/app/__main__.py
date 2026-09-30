"""Entry point: ``uv run python -m app`` starts the API on API_PORT."""

import uvicorn

from app.core.config import get_settings

settings = get_settings()

uvicorn.run(
    "app.main:app",
    host="0.0.0.0",
    port=settings.api_port,
    reload=settings.environment == "development",
)
