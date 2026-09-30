import csv
from pathlib import Path
from typing import Any

from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register

PREVIEW_ROWS = 10


def _to_float(value: str) -> float | None:
    try:
        return float(value)
    except ValueError:
        return None


@register
class CSVProcessor(BaseProcessor):
    name = "csv"
    description = "Tabular data: columns, row count, preview and numeric column stats."
    extensions = (".csv", ".tsv")

    def process(self, path: Path) -> dict[str, Any]:
        delimiter = "\t" if path.suffix.lower() == ".tsv" else ","
        with path.open(newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=delimiter)
            if not reader.fieldnames:
                raise ProcessingError("CSV file has no header row")
            columns = list(reader.fieldnames)
            preview: list[dict[str, str]] = []
            stats = {c: {"min": None, "max": None, "sum": 0.0, "count": 0} for c in columns}
            numeric = set(columns)
            row_count = 0

            for row in reader:
                row_count += 1
                if len(preview) < PREVIEW_ROWS:
                    preview.append(row)
                for col in list(numeric):
                    raw = (row.get(col) or "").strip()
                    if raw == "":
                        continue
                    value = _to_float(raw)
                    if value is None:
                        numeric.discard(col)
                        continue
                    s = stats[col]
                    s["min"] = value if s["min"] is None else min(s["min"], value)
                    s["max"] = value if s["max"] is None else max(s["max"], value)
                    s["sum"] += value
                    s["count"] += 1

        numeric_stats = {
            col: {
                "min": s["min"],
                "max": s["max"],
                "mean": s["sum"] / s["count"],
                "count": s["count"],
            }
            for col, s in stats.items()
            if col in numeric and s["count"]
        }
        return {
            "columns": columns,
            "row_count": row_count,
            "preview": preview,
            "numeric_stats": numeric_stats,
        }
