# RoadGuard AI

RoadGuard AI is an AI-powered road intelligence platform for pothole detection, hazard alerts, community reporting, route safety scoring, and repair prioritization.

## Structure

- `frontend/` React + Vite dashboard shell
- `backend/` FastAPI service with detection, reporting, and risk-scoring stubs

## Environment Setup

### Backend

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your configuration:
   - `DATABASE_URL`: SQLite (default) or PostgreSQL connection string
   - `SECRET_KEY`: Secret key for JWT (change in production)
   - `GOOGLE_MAPS_API_KEY`: Google Maps API key (optional)
   - Other optional configuration for caching, email, monitoring, etc.

### Frontend

1. Copy the example environment file:
```bash
cd frontend
cp .env.example .env
```

2. Edit `.env` with your configuration:
   - `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:8000)
   - `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key (optional)
   - Other optional configuration for features and refresh intervals

## Run locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

PostgreSQL/PostGIS migration:

```bash
cd backend
python scripts/apply_postgis_migration.py
```

## Current scope

This starter includes:

- a styled dashboard landing page
- API skeletons for health, detections, and reports
- basic duplicate-detection and risk-scoring service stubs
- room to extend into YOLOv8, GPS, map, alerting, and verification workflows
- centralized configuration management with environment variables