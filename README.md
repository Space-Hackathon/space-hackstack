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

### Primary Backend
- Python
- FastAPI

### Alternative Backend
- Node.js
- Express

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
- FastAPI backend
- Alternative Node.js backend
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

### FastAPI Backend

Requires [uv](https://docs.astral.sh/uv/). See `backend-fastapi/README.md` for endpoints and details.

cd backend-fastapi

uv sync

uv run fastapi dev app/main.py

### Node Backend

cd backend-node

npm install
npm run dev

---

## Adding a Processor

Create a new processor inside:

backend-fastapi/app/processors/

Example:

satellite_processor.py

Subclass `BaseProcessor`, implement `process(path)`, decorate it with
`@register`, and import it in `app/processors/__init__.py`.

---

## Adding an ML Model

Place model files inside:

backend-fastapi/app/ml/models/

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
