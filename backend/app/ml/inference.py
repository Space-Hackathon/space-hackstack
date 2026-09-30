from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import get_settings


class DummyModel:
    """Stand-in used until a real model file is present at MODEL_PATH."""

    name = "dummy-mean"

    def predict(self, features: list[float]) -> float:
        return sum(features) / len(features) if features else 0.0


@lru_cache
def load_model() -> Any:
    path: Path = get_settings().model_path
    if path.exists():
        # Load your real model here, e.g.:
        #   import torch; return torch.load(path)
        #   import joblib; return joblib.load(path)
        pass
    return DummyModel()


def model_info() -> dict[str, Any]:
    path = get_settings().model_path
    model = load_model()
    return {
        "model": getattr(model, "name", type(model).__name__),
        "model_path": str(path),
        "model_file_present": path.exists(),
    }


def infer(features: list[float]) -> Any:
    return load_model().predict(features)
