#!/bin/bash
set -e

echo "Starting OpenClaw Backend..."
cd backend && python -m uvicorn app.main:app --host localhost --port 8000 --reload &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"
sleep 3

echo "Starting OpenClaw Frontend..."
cd ../frontend && npm run dev
