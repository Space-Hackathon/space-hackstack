import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register

EARTH_MU_KM3_S2 = 398600.4418
EARTH_RADIUS_KM = 6378.137


def _epoch(field: str) -> datetime:
    year = int(field[:2])
    year += 2000 if year < 57 else 1900
    day_of_year = float(field[2:])
    return datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=day_of_year - 1)


def _parse(name: str | None, line1: str, line2: str) -> dict[str, Any]:
    mean_motion = float(line2[52:63])  # revolutions per day
    period_s = 86400.0 / mean_motion
    semi_major_km = (EARTH_MU_KM3_S2 * (period_s / (2 * math.pi)) ** 2) ** (1 / 3)
    eccentricity = float("0." + line2[26:33].strip())
    return {
        "name": name,
        "norad_id": int(line1[2:7]),
        "classification": line1[7],
        "international_designator": line1[9:17].strip(),
        "epoch": _epoch(line1[18:32].strip()).isoformat(),
        "inclination_deg": float(line2[8:16]),
        "raan_deg": float(line2[17:25]),
        "eccentricity": eccentricity,
        "arg_perigee_deg": float(line2[34:42]),
        "mean_anomaly_deg": float(line2[43:51]),
        "mean_motion_rev_per_day": mean_motion,
        "period_min": period_s / 60,
        "apogee_km": semi_major_km * (1 + eccentricity) - EARTH_RADIUS_KM,
        "perigee_km": semi_major_km * (1 - eccentricity) - EARTH_RADIUS_KM,
    }


@register
class TLEProcessor(BaseProcessor):
    name = "tle"
    description = "Satellite Two-Line Element sets: parsed orbital elements per object."
    extensions = (".tle", ".3le")

    def process(self, path: Path) -> dict[str, Any]:
        lines = [ln.rstrip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
        satellites: list[dict[str, Any]] = []
        errors: list[str] = []
        i = 0
        while i < len(lines):
            name = None
            if not lines[i].startswith("1 "):
                name = lines[i].removeprefix("0 ").strip()
                i += 1
            if i + 1 >= len(lines) or not lines[i].startswith("1 ") or not lines[i + 1].startswith("2 "):
                errors.append(f"Malformed TLE near line {i + 1}")
                i += 1
                continue
            try:
                satellites.append(_parse(name, lines[i], lines[i + 1]))
            except (ValueError, IndexError) as exc:
                errors.append(f"Could not parse TLE near line {i + 1}: {exc}")
            i += 2

        if not satellites:
            raise ProcessingError("No valid TLE records found" + (f": {errors[0]}" if errors else ""))
        return {"count": len(satellites), "satellites": satellites, "errors": errors}
