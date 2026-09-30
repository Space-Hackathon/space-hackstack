from datetime import datetime, timezone
from typing import Any

from sqlmodel import JSON, Column, Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class DataFileBase(SQLModel):
    filename: str
    content_type: str | None = None
    size_bytes: int
    processor: str | None = None
    status: str = "uploaded"  # uploaded | processed | failed


class DataFile(DataFileBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    stored_path: str
    result: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = None
    created_at: datetime = Field(default_factory=_utcnow)
    processed_at: datetime | None = None


class DataFileRead(DataFileBase):
    id: int
    created_at: datetime
    processed_at: datetime | None


class DataFileDetail(DataFileRead):
    result: dict[str, Any] | None
    error: str | None
