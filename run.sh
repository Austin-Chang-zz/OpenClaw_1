#!/bin/bash

WORKSPACE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting OpenClaw Backend API on port 3001..."
cd "$WORKSPACE_DIR/backend" && python -m uvicorn app.main:app --host localhost --port 3001 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

echo "Waiting for backend to be ready..."
sleep 4

echo "Starting OpenClaw Frontend on port 5000..."
cd "$WORKSPACE_DIR/frontend" && npm run dev
