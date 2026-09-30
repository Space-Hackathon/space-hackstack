# backend (Node.js)

Node.js + Express implementation of the Space Hackstack backend. Upload
satellite and related data files, run pluggable processors over them, store
results in SQLite, and expose an ML inference endpoint.

This directory is swappable: the `fast-api` branch provides a Python
implementation at the same `backend/` path. Both follow the
[backend contract](#backend-contract) below, so the frontend works with either
one unchanged. Both also use the same SQLite table layout, so an existing
`data/app.db` keeps working when you switch branches.

## Run

Requires Node.js 20+.

```bash
cd backend
npm install
cp .env.example .env
npm run dev             # serves on API_PORT (default 8000), restarts on file changes
```

`npm start` runs without file watching.

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

Tests: `npm test`

## Layout

```
app/
  server.js            Entry point: init DB, listen on API_PORT
  main.js              App factory: CORS, JSON body, routers, /docs, error handling
  core/config.js       Settings loaded from .env
  core/database.js     SQLite (better-sqlite3) connection and schema
  core/errors.js       HttpError and FastAPI-compatible error responses
  models.js            DataFile queries and response shapes
  api/router.js        Mounts all routes under API_PREFIX (/api)
  api/routes/          health, files, processors, ml
  api/openapi.js       OpenAPI spec served at /openapi.json and /docs
  services/            upload storage (multer), running processors
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

Errors are `{"detail": "message"}`. Request validation errors (bad query or
path parameters, missing `file` field, non-object JSON body) are 422 with
`detail` as a list: `[{"type", "loc", "msg", "input"}]`.

### Differences from the FastAPI backend

Responses were compared side by side against the FastAPI backend and match
(ignoring ids and timestamps), except:

- `.bmp` images are not supported (sharp cannot read BMP).
- The wording of `Invalid JSON: ...` processor errors comes from the
  JavaScript JSON parser.
- `DATABASE_URL` must be `sqlite:///<path>`; PostgreSQL is not supported here.
- Timestamps have millisecond rather than microsecond precision.

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

Create `app/processors/my-format.js`:

```js
import { ProcessingError } from "./base.js";
import { register } from "./registry.js";

export default register({
  name: "my-format",
  description: "What it extracts",
  extensions: [".dat"],

  async process(filePath) {
    // throw new ProcessingError("...") for bad input
    return { anything: "JSON-serialisable" };
  },
});
```

Then add `import "./my-format.js";` to `app/processors/index.js`. Uploads with
a matching extension will use it automatically. If the FastAPI branch has the
same processor, keep the result shape identical.

## Adding a model

Put weights at `MODEL_PATH` (default `app/ml/models/model.pt`, git-ignored; for
Node an `.onnx` file with `onnxruntime-node` is the usual choice), load them in
`app/ml/inference.js`, and adapt `preprocessing.js` / `postprocessing.js`. The
`/api/ml/*` routes don't change.
