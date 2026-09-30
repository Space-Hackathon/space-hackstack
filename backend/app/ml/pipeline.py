from typing import Any

from app.ml.inference import infer, model_info
from app.ml.postprocessing import postprocess
from app.ml.preprocessing import preprocess


def predict(payload: dict[str, Any]) -> dict[str, Any]:
    features = preprocess(payload)
    output = postprocess(infer(features))
    output["model"] = model_info()["model"]
    return output
