# Deployment Guide

## Overview

This project is split into two deployable services:

- `frontend/`: Next.js application
- `backend/`: FastAPI API

Recommended production topology:

- Frontend and backend behind Nginx on one host, or deployed separately behind a reverse proxy
- Managed PostgreSQL database when possible

For local development, the project also supports SQLite for the backend.

## Recommended Production Setup

### Frontend

- Deploy `frontend/` as a standalone Next.js app
- Prefer calling the backend through the same origin with `/api`
- When using the bundled Nginx setup, set:
  - `NEXT_PUBLIC_API_BASE_URL=/api`
- For local non-Docker development, keep:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`

### Backend

- Deploy `backend/` as a container
- Set:
  - `DVA_DATABASE_URL`
  - `DVA_CORS_ORIGINS`
  - `DVA_DEBUG=false`

Recommended database URL format for PostgreSQL:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DB_NAME
```

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload
```

Default local database:

- SQLite file at `backend/dialect_video_annotator.db`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Docker Compose

The repository includes `docker-compose.yml` for a reverse-proxied container stack.

```bash
docker compose up --build
```

Services:

- Nginx on port `80`
- FastAPI backend on the internal Docker network
- Next.js frontend on the internal Docker network
- PostgreSQL on the internal Docker network

## Environment Variables

### Backend

`backend/.env`

```text
DVA_DATABASE_URL=sqlite:///./dialect_video_annotator.db
DVA_CORS_ORIGINS=["http://localhost:3000"]
DVA_DEBUG=false
```

### Frontend

`frontend/.env.local`

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

For the Docker Compose stack, the environment is injected by `docker-compose.yml` as:

```text
NEXT_PUBLIC_API_BASE_URL=/api
```

## Operational Recommendations

### Database

- Use managed PostgreSQL in production
- Back up the database regularly
- Run `alembic upgrade head` during deployment before the backend starts serving traffic
- Run the seed command after migrations:
  - `python -m app.db.seed`

### Scaling

- The requirements call for supporting at least 15 concurrent annotators
- This architecture is appropriate for that scale when deployed with:
  - at least one modest application instance for the backend
  - a managed PostgreSQL instance
  - basic indexing on range, voice, and vocabulary relations

### Security

- Restrict backend CORS to known frontend origins
- Do not run production with `DVA_DEBUG=true`
- Put the backend behind HTTPS
- Add authentication and role checks before broader rollout if the tool stops being internal-only

### Monitoring

- Add request logging on backend
- Monitor API latency for:
  - create range
  - voice stats queries
  - admin range list queries
- Add uptime checks for `/api/health`

## Existing Local SQLite Databases

If a developer already has a local SQLite file created by the earlier auto-create flow, the database may not yet have an Alembic version record.

Options:

- reset local dev data by deleting the SQLite file, then rerun migrations and seed
- or, if the schema already matches the initial migration, run:
  - `alembic stamp head`

## Suggested Production Rollout

1. Deploy backend with PostgreSQL.
2. Run database migrations:
   - `alembic upgrade head`
3. Run seed data:
   - `python -m app.db.seed`
4. Verify seeded vocabularies appear on first boot.
5. Deploy frontend with the correct API base URL.
   - with the bundled Nginx setup: `/api`
6. Run smoke tests:
   - resolve a YouTube URL
   - create a voice
   - create a range
   - update a range
   - open admin voice detail
7. Load-test normal annotation flows with roughly 15 concurrent users.

## Gaps to Address Before a Larger Production Launch

- authentication and authorization
- structured audit logs
- richer observability and error tracking
- background jobs if heavy imports or exports are added later
