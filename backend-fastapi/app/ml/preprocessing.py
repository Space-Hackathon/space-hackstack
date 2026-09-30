from typing import Any


def preprocess(payload: dict[str, Any]) -> list[float]:
    """Turn a raw request payload into model input.

    Placeholder: expects ``{"features": [numbers...]}``. Replace with real
    feature extraction (e.g. loading and normalising an image tile).
    """
    features = payload.get("features")
    if not isinstance(features, list) or not all(isinstance(x, (int, float)) for x in features):
        raise ValueError("payload must contain 'features': a list of numbers")
    return [float(x) for x in features]
