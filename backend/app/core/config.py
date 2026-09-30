from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Space Hackstack API"
    environment: str = "development"
    api_port: int = 8000
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    database_url: str = "sqlite:///./data/app.db"
    upload_dir: Path = Path("./data/raw")
    max_upload_mb: int = 200
    model_path: Path = Path("./app/ml/models/model.pt")


@lru_cache
def get_settings() -> Settings:
    return Settings()
