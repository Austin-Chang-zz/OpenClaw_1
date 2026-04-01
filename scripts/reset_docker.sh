#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# OpenClaw – Tear down and rebuild all Docker containers cleanly.
# WARNING: This removes all containers and their images. Data volumes are
# preserved by default. Use --volumes to also wipe the database and redis.
# Usage: ./scripts/reset_docker.sh [--volumes]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose.yml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[reset]${NC} $*"; }
warning() { echo -e "${YELLOW}[reset]${NC} $*"; }

WIPE_VOLUMES=false
if [[ "${1:-}" == "--volumes" ]]; then
    WIPE_VOLUMES=true
    warning "⚠️  --volumes flag set: ALL database data will be erased."
    read -rp "Are you sure? Type YES to continue: " CONFIRM
    [[ "$CONFIRM" == "YES" ]] || { info "Aborted."; exit 0; }
fi

info "Stopping all OpenClaw containers..."
docker compose -f "$COMPOSE_FILE" down --rmi local $( $WIPE_VOLUMES && echo "--volumes" || echo "" )

info "Rebuilding images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

info "Starting fresh..."
docker compose -f "$COMPOSE_FILE" up -d

info "Reset complete. Run ./scripts/setup.sh to wait for health checks."
