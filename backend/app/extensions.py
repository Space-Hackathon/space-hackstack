"""Load trusted local extension modules selected in backend/.env."""
from functools import lru_cache
from importlib import import_module
from typing import Any

from app.core.config import get_settings
from app.ml import pipeline as default_pipeline
from app.ml.inference import model_info as default_model_info

@lru_cache
def load_pipeline(module_name: str | None):
    if not module_name:
        return default_pipeline.predict, default_model_info
    module = import_module(module_name)
    if not callable(getattr(module, "predict", None)) or not callable(getattr(module, "model_info", None)):
        raise TypeError("ML_PIPELINE_MODULE must export predict(payload) and model_info()")
    return module.predict, module.model_info

def load_extensions():
    settings = get_settings()
    for module_name in settings.processor_modules:
        import_module(module_name)
    # Validate the model adapter at startup, before serving traffic.
    load_pipeline(settings.ml_pipeline_module)

def predict(payload: dict[str, Any]) -> dict[str, Any]:
    run, _ = load_pipeline(get_settings().ml_pipeline_module)
    return run(payload)

def model_info() -> dict[str, Any]:
    _, info = load_pipeline(get_settings().ml_pipeline_module)
    return info()
