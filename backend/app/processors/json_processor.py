import json
from pathlib import Path
from typing import Any

from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register


def _describe(value: Any, depth: int = 0, max_depth: int = 3) -> Any:
    """Summarise the shape of a JSON value without echoing all of it."""
    if isinstance(value, dict):
        if depth >= max_depth:
            return f"object({len(value)} keys)"
        return {k: _describe(v, depth + 1, max_depth) for k, v in value.items()}
    if isinstance(value, list):
        if not value:
            return "array(0)"
        return {"array": len(value), "items": _describe(value[0], depth + 1, max_depth)}
    return type(value).__name__


@register
class JSONProcessor(BaseProcessor):
    name = "json"
    description = "JSON / GeoJSON: structure summary and GeoJSON feature counts."
    extensions = (".json", ".geojson")

    def process(self, path: Path) -> dict[str, Any]:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ProcessingError(f"Invalid JSON: {exc}") from exc

        result: dict[str, Any] = {"root_type": type(data).__name__, "schema": _describe(data)}
        if isinstance(data, dict) and data.get("type") == "FeatureCollection":
            features = data.get("features") or []
            geometry_types: dict[str, int] = {}
            for feature in features:
                gtype = (feature.get("geometry") or {}).get("type", "None")
                geometry_types[gtype] = geometry_types.get(gtype, 0) + 1
            result["geojson"] = {"feature_count": len(features), "geometry_types": geometry_types}
        return result
