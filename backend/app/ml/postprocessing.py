from typing import Any


def postprocess(raw_output: Any) -> dict[str, Any]:
    """Convert raw model output into the API response shape."""
    return {"prediction": raw_output}
