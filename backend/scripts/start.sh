#!/usr/bin/env sh
set -eu

alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000
