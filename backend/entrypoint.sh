#!/bin/bash
set -e

mkdir -p /app/uploads/images
chmod -R 777 /app/uploads 2>/dev/null || true

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
