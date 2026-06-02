#!/usr/bin/env bash
#
# Tear down the local end-to-end stack started by e2e-up.sh: stop the docker
# compose server and kill the http-server serving the client on :9000.
#
# Usage (from repo root):
#   ./e2e/scripts/e2e-down.sh                # stop server + client
#   ./e2e/scripts/e2e-down.sh --volumes      # also remove docker volumes (drops DB state)
#
# Always exits 0 even if some pieces were already stopped — the script is
# idempotent.

set -euo pipefail

VOLUMES=false

for arg in "$@"; do
    case "$arg" in
        --volumes) VOLUMES=true ;;
        *) echo "unknown argument: $arg" >&2; exit 2 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_SERVER="$REPO_ROOT/e2e/server"

log() { printf '\n[e2e-down] %s\n' "$*"; }

# Kill anything listening on the client port. `lsof -ti` works on macOS and
# Linux. Suppress errors when nothing is listening.
if command -v lsof > /dev/null; then
    if pids=$(lsof -ti:9000 2>/dev/null); then
        log "stopping client server (PIDs: $pids)"
        kill $pids 2>/dev/null || true
    else
        log "no client server running on :9000"
    fi
else
    log "lsof not found; skipping client server stop"
fi

# Stop the dockerized server stack.
if [ -f "$E2E_SERVER/docker-compose.yml" ]; then
    if [ "$VOLUMES" = true ]; then
        log "docker compose down -v (volumes removed; DB state dropped)"
        (cd "$E2E_SERVER" && docker compose down -v)
    else
        log "docker compose down"
        (cd "$E2E_SERVER" && docker compose down)
    fi
else
    log "no $E2E_SERVER/docker-compose.yml; nothing to tear down"
fi

log "done"
