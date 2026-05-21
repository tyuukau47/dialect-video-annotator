# Dialect Video Annotator

A full-stack internal tool for collecting voice ranges from YouTube videos, assigning them to speaker profiles, and reviewing collection statistics.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, TanStack Query
- Backend: FastAPI, SQLAlchemy
- Database: SQLite for local simplicity, PostgreSQL-ready for deployment
- Video playback: YouTube IFrame Player API

## App Areas

- `frontend/annotation`: load a YouTube link and annotate ranges
- `frontend/voices`: create, edit, archive, and review voices
- `frontend/vocabularies`: manage controlled vocabularies for gender and emotion
- `frontend/admin/voices`: review one voice at a time with collection statistics

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/api/health`

## Docker Compose

```bash
docker compose up --build
```

This starts:

- Nginx on `80`
- Next.js frontend on the internal Docker network
- FastAPI backend on the internal Docker network
- PostgreSQL on the internal Docker network

Open:

- App: `http://localhost`

Notes:

- The Docker Compose stack injects `NEXT_PUBLIC_API_BASE_URL=/api` automatically through Nginx.
- The `frontend/.env.example` file remains pointed at `http://localhost:8000/api` for non-Docker local development.
- For local API checks from the host, use the backend dev workflow above instead of Docker Compose.

## Database Workflow

The backend now uses Alembic migrations plus an idempotent seed command.

Common commands:

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
```

Create a new migration:

```bash
cd backend
uv sync
uv run alembic revision --autogenerate -m "describe change"
```

If you already have an older local SQLite database from the pre-Alembic startup flow, use one of these approaches before migrating:

- easiest for local dev: delete `backend/dialect_video_annotator.db`, then run `alembic upgrade head` and `python -m app.db.seed`
- if you need to keep the existing data and the schema already matches the initial migration: run `alembic stamp head` first, then continue with new migrations

## Docs

- [Requirements](doc/REQUIREMENTS.md)
- [API Proposal](doc/API.md)
- [Tech Research](doc/TECH_RESEARCH.md)
- [Tech Spec](doc/TECH_SPEC.md)
- [UI Mockups](doc/UI_MOCKUPS.md)
- [Deployment Guide](doc/DEPLOYMENT.md)
