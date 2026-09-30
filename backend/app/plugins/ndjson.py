"""Example opt-in processor: PROCESSOR_MODULES=["app.plugins.ndjson"]."""
import json
from pathlib import Path
from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register

@register
class NDJSONProcessor(BaseProcessor):
    name = "ndjson"
    description = "Read newline-delimited JSON records"
    extensions = (".ndjson", ".jsonl")

    def process(self, path: Path) -> dict:
        count, preview = 0, []
        with path.open(encoding="utf-8-sig") as source:
            for number, line in enumerate(source, start=1):
                if not line.strip():
                    continue
                try:
                    record = json.loads(line, parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
                except ValueError as exc:
                    raise ProcessingError(f"Invalid JSON on line {number}") from exc
                count += 1
                if len(preview) < 5:
                    preview.append(record)
        return {"record_count": count, "preview": preview}
