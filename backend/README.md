# backend (FastAPI)

FastAPI implementation of the Space Hackstack backend. Upload satellite and
related data files, run pluggable processors over them, store results in
SQLite, and expose an ML inference endpoint.

This directory is swappable: another branch provides a Node implementation
at the same `backend/` path. Both follow the [backend contract](#backend-contract)
below, so the frontend works with either one unchanged.

## Run

Dependencies are managed with [uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync                 # creates .venv and installs deps + dev group from uv.lock
cp .env.example .env
uv run python -m app    # serves on API_PORT (default 8000), auto-reload in development
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

Tests: `uv run pytest`

Add a dependency: `uv add rasterio` (or `uv add --dev ruff` for dev-only).
Commit both `pyproject.toml` and `uv.lock`.

## Layout

```
app/
  main.py              App factory: CORS, lifespan (creates DB tables), routers
  core/config.py       Settings loaded from .env
  core/database.py     SQLModel engine + session dependency
  models.py            DataFile table and response schemas
  api/router.py        Mounts all routes under API_PREFIX (/api)
  api/routes/          health, files, processors, ml
  services/            upload storage, running processors
  processors/          Pluggable file processors (csv, txt, json, image, tle)
  ml/                  preprocessing -> inference -> postprocessing pipeline
data/
  raw/                 Uploaded files (git-ignored)
  samples/             Example inputs (ISS TLE, ground-pass CSV)
tests/
```

## Backend contract

Any implementation placed in `backend/` must provide the following, so it can be
dropped in without touching the frontend:

- **Start:** a single command from `backend/` that serves on `API_PORT` (default `8000`).
- **Config:** reads `backend/.env` using the variables in `.env.example`
  (`API_PORT`, `API_PREFIX`, `CORS_ORIGINS`, `DATABASE_URL`, `UPLOAD_DIR`,
  `MAX_UPLOAD_MB`, `MODEL_PATH`).
- **Routes:** everything under `API_PREFIX` (default `/api`), with the endpoints,
  status codes and JSON shapes below.
- **Data:** uploads in `data/raw/`, sample inputs in `data/samples/`, SQLite at
  `data/app.db`.

A file record (`GET /api/files/{id}`) looks like:

```json
{
  "id": 1,
  "filename": "iss.tle",
  "content_type": "application/octet-stream",
  "size_bytes": 152,
  "processor": "tle",
  "status": "processed",
  "created_at": "2026-09-30T17:22:26.591870Z",
  "processed_at": "2026-09-30T17:22:26.599112Z",
  "result": { "count": 1, "satellites": [ ... ], "errors": [] },
  "error": null
}
```

`status` is one of `uploaded`, `processed` or `failed` (with `error` set). List
responses (`GET /api/files`) omit `result` and `error`. The full schema is
served at `/openapi.json`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | App + DB status |
| GET | `/api/processors` | Registered processors and their extensions |
| POST | `/api/files` | Upload a file (multipart `file`). Auto-processes by extension; `?process=false` to skip, `?processor=name` to force |
| GET | `/api/files` | List uploads (`offset`, `limit`) |
| GET | `/api/files/{id}` | File metadata + processing result |
| GET | `/api/files/{id}/download` | Original file |
| POST | `/api/files/{id}/process` | (Re)run a processor (`?processor=name` optional) |
| DELETE | `/api/files/{id}` | Delete record and stored file |
| GET | `/api/ml/model` | Loaded model info |
| POST | `/api/ml/predict` | Run the ML pipeline, e.g. `{"features": [1, 2, 3]}` |

Try it:

```bash
curl -F file=@data/samples/iss.tle http://localhost:8000/api/files
```

## Adding a processor

Create `app/processors/my_processor.py`:

```python
from pathlib import Path
from app.processors.base import BaseProcessor, ProcessingError
from app.processors.registry import register

@register
class MyProcessor(BaseProcessor):
    name = "my-format"
    description = "What it extracts"
    extensions = (".dat",)

    def process(self, path: Path) -> dict:
        ...  # raise ProcessingError for bad input
        return {"anything": "JSON-serialisable"}
```

Then add it to the import list in `app/processors/__init__.py`. Uploads with
a matching extension will use it automatically.

Heavier satellite formats (GeoTIFF with georeferencing, NetCDF, HDF5) fit the
same pattern; `uv add rasterio`, `xarray` or `h5py` as needed.

## Adding a model

Put weights at `MODEL_PATH` (default `app/ml/models/model.pt`, git-ignored),
load them in `app/ml/inference.py:load_model`, and adapt
`preprocessing.py` / `postprocessing.py`. The `/api/ml/*` routes don't change.

## Switching to PostgreSQL

Set `DATABASE_URL=postgresql+psycopg://user:pass@host/db` and
`uv add "psycopg[binary]"`. Tables are created on startup.
