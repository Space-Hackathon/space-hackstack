import os
import tempfile
from pathlib import Path

import pytest

# Point the app at a throwaway DB and upload dir before any app module is imported.
_tmp = Path(tempfile.mkdtemp(prefix="hackstack-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_tmp / 'test.db').as_posix()}"
os.environ["UPLOAD_DIR"] = str(_tmp / "raw")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

SAMPLES = Path(__file__).resolve().parent.parent / "data" / "samples"


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def samples() -> Path:
    return SAMPLES
