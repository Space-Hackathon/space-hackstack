# backend-fastapi

FastAPI backend for the Space Hackstack monorepo. Upload satellite and
related data files, run pluggable processors over them, store results in
SQLite, and expose an ML inference endpoint.

## Run

Dependencies are managed with [uv](https://docs.astral.sh/uv/).

```bash
cd backend-fastapi
uv sync                 # creates .venv and installs deps + dev group from uv.lock
cp .env.example .env
uv run fastapi dev app/main.py
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
