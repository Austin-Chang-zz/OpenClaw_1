#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# OpenClaw – One-command setup script (Epic 1 / J1.5)
# Usage: ./scripts/setup.sh
# Checks Docker, required ports, creates .env, starts Docker Compose,
# waits for health checks, runs migrations, and prints the dashboard URL.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose.yml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${GREEN}[setup]${NC} $*"; }
warning() { echo -e "${YELLOW}[setup]${NC} $*"; }
error()   { echo -e "${RED}[setup] ERROR:${NC} $*" >&2; exit 1; }

# ── 1. Check Docker ──────────────────────────────────────────────────────────
info "Checking Docker..."
command -v docker >/dev/null 2>&1 || error "Docker is not installed. Install from https://docs.docker.com/get-docker/"
docker info >/dev/null 2>&1       || error "Docker is not running. Start Docker Desktop and retry."
command -v docker compose >/dev/null 2>&1 || docker-compose --version >/dev/null 2>&1 \
    || error "Docker Compose not found. Install Docker Desktop (includes Compose)."
info "Docker OK"

# ── 2. Check required ports ──────────────────────────────────────────────────
info "Checking ports 8000, 5432, 6379..."
for PORT in 8000 5432 6379; do
    if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
        warning "Port $PORT is already in use. Stop the conflicting process or change the port mapping in docker/docker-compose.yml."
    fi
done
info "Port check complete"

# ── 3. Create .env from .env.example ────────────────────────────────────────
if [ ! -f "$REPO_ROOT/.env" ]; then
    info "Creating .env from .env.example..."
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
    warning ".env created. Edit it and set SECRET_KEY and any AI provider keys before proceeding."
    warning "Re-run this script after editing .env"
    exit 0
else
    info ".env already exists — skipping copy"
fi

# ── 4. Create required host directories ──────────────────────────────────────
info "Creating data/ and assets/ directories..."
mkdir -p "$REPO_ROOT/data/knowledge_base" \
         "$REPO_ROOT/data/transcripts" \
         "$REPO_ROOT/assets"

# ── 5. Start Docker Compose ──────────────────────────────────────────────────
info "Starting Docker Compose services (app, worker, postgres, redis)..."
docker compose -f "$COMPOSE_FILE" up -d --build

# ── 6. Wait for health checks ────────────────────────────────────────────────
info "Waiting for services to become healthy (up to 90 seconds)..."
TIMEOUT=90
ELAPSED=0
HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    ALL_HEALTHY=true
    for SVC in postgres redis app; do
        STATUS=$(docker compose -f "$COMPOSE_FILE" ps --format json "$SVC" 2>/dev/null \
            | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','unknown'))" 2>/dev/null || echo "unknown")
        if [ "$STATUS" != "healthy" ]; then
            ALL_HEALTHY=false
        fi
    done
    if $ALL_HEALTHY; then
        HEALTHY=true
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo -n "."
done
echo ""

if ! $HEALTHY; then
    warning "Some services did not become healthy in time. Showing logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=30
    error "Setup failed. Fix errors above and re-run."
fi
info "All services healthy"

# ── 7. Run database migrations ───────────────────────────────────────────────
info "Running database migrations (alembic upgrade head)..."
docker compose -f "$COMPOSE_FILE" exec app alembic upgrade head 2>/dev/null \
    || warning "Alembic migrations skipped (tables may be auto-created by SQLAlchemy)"

# ── 8. Print success ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  OpenClaw is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Backend API:   http://localhost:8000"
echo -e "  API Docs:      http://localhost:8000/docs"
echo -e "  Health check:  http://localhost:8000/health"
echo -e "  Dashboard:     http://localhost:3000  (start frontend separately)"
echo ""
echo -e "  Stop all:      docker compose -f docker/docker-compose.yml down"
echo -e "  View logs:     docker compose -f docker/docker-compose.yml logs -f"
echo ""
