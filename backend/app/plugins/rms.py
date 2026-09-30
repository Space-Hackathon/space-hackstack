"""Example adapter, not a trained model: ML_PIPELINE_MODULE=app.plugins.rms."""
import math
from app.ml.preprocessing import preprocess

def model_info() -> dict:
    return {"model": "example-rms", "model_path": "", "model_file_present": False}

def predict(payload: dict) -> dict:
    features = preprocess(payload)
    # Scaling avoids overflow when squaring large finite inputs.
    scale = max((abs(x) for x in features), default=0)
    value = scale * math.sqrt(sum((x / scale) ** 2 for x in features) / len(features)) if scale else 0
    return {"prediction": value, "model": "example-rms"}
