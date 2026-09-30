from collections.abc import Iterator
from pathlib import Path

from sqlalchemy.engine import make_url
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings

settings = get_settings()

_url = make_url(settings.database_url)
_connect_args: dict = {}
if _url.get_backend_name() == "sqlite":
    # FastAPI may touch the session from different threads.
    _connect_args["check_same_thread"] = False
    if _url.database and _url.database != ":memory:":
        Path(_url.database).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(settings.database_url, connect_args=_connect_args)


def init_db() -> None:
    # Import models so their tables are registered on the metadata.
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
