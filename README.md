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

cd backend-fastapi

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload

### Node Backend

cd backend-node

npm install
npm run dev

---

## Adding a Processor

Create a new processor inside:

processors/

Example:

satellite_processor.py

Implement:

process(file)

Register the processor with the file processing service.

---

## Adding an ML Model

Place model files inside:

ml/models/

Add preprocessing logic to:

ml/preprocessing.py

Add inference logic to:

ml/inference.py

Add output transformation to:

ml/postprocessing.py

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
MODEL_PATH=./ml/models/model.pt

---

## Intended Use

This repository is designed for:

- Hackathons
- AI/ML prototypes
- Data processing applications
- Research projects
- Dashboard applications
- Proof-of-concept applications
- Bomboclaat

Domain-specific functionality should be implemented as independent
processing modules rather than modifying the core architecture.
