# Rapid Prototype Stack

A lightweight, modular full-stack starter repository for rapidly
building data-driven applications, AI/ML prototypes, dashboards,
and hackathon projects.

The repository is intentionally domain-agnostic. Processing modules
can be added or replaced without changing the core application.

## Stack

### Frontend
- React
- Vite

### Backend (plug and play)
The backend lives in `backend/` and has one implementation per branch:

- `fast-api` branch: Python + FastAPI (uv)
- Node branch: Node.js + Express

Both implement the same backend contract (port, env vars, `/api` routes,
response shapes, data layout), documented in `backend/README.md`. The
frontend talks only to that contract, so switching branches swaps the
backend without frontend changes.

### Database
- SQLite
- SQLModel / SQLAlchemy

### Data Processing
- CSV
- TXT
- JSON
- Images
- Custom file processors

### Machine Learning
- Python
- Pluggable inference pipeline

---

## Architecture

Frontend
   |
   | REST API
   v
Backend
   |
   +---- File Processing
   |
   +---- ML / AI
   |
   +---- Database
   |
   +---- File Storage

---

## Features

- React frontend
- Swappable backend (FastAPI or Node.js) behind one API contract
- REST API structure
- File uploads
- CSV processing
- TXT processing
- JSON processing
- Image processing
- SQLite database
- Plug-and-play processors
- ML model integration
- Environment configuration
- Sample data
- Health check endpoint

---

## Quick Start

### Frontend

cd frontend
npm install
npm run dev

### Backend

The API serves on http://localhost:8000/api whichever implementation is
checked out. See `backend/README.md` for the contract and endpoints.

FastAPI (`fast-api` branch, requires [uv](https://docs.astral.sh/uv/)):

cd backend
uv sync
uv run python -m app

Node (Node branch):

cd backend
npm install
npm run dev

---

## Adding a Processor

Create a new processor inside:

backend/app/processors/

Example:

satellite_processor.py

Subclass `BaseProcessor`, implement `process(path)`, decorate it with
`@register`, and import it in `app/processors/__init__.py`.

---

## Adding an ML Model

Place model files inside:

backend/app/ml/models/

Add preprocessing logic to:

app/ml/preprocessing.py

Add inference logic to:

app/ml/inference.py

Add output transformation to:

app/ml/postprocessing.py

The API can then expose model results without requiring changes
to the frontend.

---

## Database

Development uses SQLite by default.

DATABASE_URL=sqlite:///./data/app.db

The database layer is designed so PostgreSQL can be introduced later
without restructuring the application.

---

## Environment Variables

Copy:

.env.example

to:

.env

Example:

API_PORT=8000
DATABASE_URL=sqlite:///./data/app.db
UPLOAD_DIR=./data/raw
MODEL_PATH=./app/ml/models/model.pt

---

## Intended Use

This repository is designed for:

- Hackathons
- AI/ML prototypes
- Data processing applications
- Research projects
- Dashboard applications
- Proof-of-concept applications

Domain-specific functionality should be implemented as independent
processing modules rather than modifying the core architecture.

## Reusable component kit

The frontend lives in frontend/ on both component branches and uses the same API contract.
Run npm ci and npm run dev there; configure its .env with VITE_API_URL=http://localhost:8000/api.
See frontend/README.md for independent upload, file list/detail, processor selector, result renderer,
health, and model playground components. No frontend edits are needed to switch backends.

Backend plugins are opt-in through backend/.env. See backend/PLUGINS.md for runnable examples.
GET /api/capabilities describes registered processors, enabled features, and upload limits.
