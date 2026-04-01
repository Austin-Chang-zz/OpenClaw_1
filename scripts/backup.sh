#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# OpenClaw – Backup script
# Backs up the PostgreSQL database and the data/ and assets/ directories.
# Output is written to ./backups/<timestamp>/
# Usage: ./scripts/backup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker/docker-compose.yml"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$REPO_ROOT/backups/$TIMESTAMP"

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[backup]${NC} $*"; }
error() { echo -e "${RED}[backup] ERROR:${NC} $*" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"

# ── 1. PostgreSQL dump ───────────────────────────────────────────────────────
info "Dumping PostgreSQL database..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U openclaw openclaw \
    > "$BACKUP_DIR/openclaw_db_$TIMESTAMP.sql" \
    || error "Database dump failed. Is the postgres container running?"
info "Database dump saved to $BACKUP_DIR/openclaw_db_$TIMESTAMP.sql"

# ── 2. Data and assets directories ──────────────────────────────────────────
info "Archiving data/ and assets/ directories..."
tar -czf "$BACKUP_DIR/data_$TIMESTAMP.tar.gz" -C "$REPO_ROOT" data/ 2>/dev/null || true
tar -czf "$BACKUP_DIR/assets_$TIMESTAMP.tar.gz" -C "$REPO_ROOT" assets/ 2>/dev/null || true
info "Archives saved to $BACKUP_DIR/"

# ── 3. Summary ──────────────────────────────────────────────────────────────
echo ""
info "Backup complete:"
ls -lh "$BACKUP_DIR/"
echo ""
info "To restore the database: psql -U openclaw openclaw < $BACKUP_DIR/openclaw_db_$TIMESTAMP.sql"
