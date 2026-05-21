#!/usr/bin/env bash
#
# Bring up the local end-to-end stack: server (docker compose) + client dev
# server. Mirrors what CI's setup-e2e composite action does, with idempotence
# and health checks so the script can be run repeatedly without doing wasted
# work.
#
# Usage:
#   ./e2e-up.sh                  # bring up the stack
#   ./e2e-up.sh --reinstall      # force `npm ci` in every dependency root
#   ./e2e-up.sh --rebuild        # force docker compose build
#
# Exits 0 only when both the server (http://localhost:5000/api/) and the
# client (http://localhost:9000/) respond. Otherwise exits non-zero with a
# clear error message.

set -euo pipefail

REINSTALL=false
REBUILD=false

for arg in "$@"; do
    case "$arg" in
        --reinstall) REINSTALL=true ;;
        --rebuild) REBUILD=true ;;
        *) echo "unknown argument: $arg" >&2; exit 2 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_CLIENT="$REPO_ROOT/e2e/client"
E2E_SERVER="$REPO_ROOT/e2e/server"

# SUPERDESK_URL is the single knob: point it at the e2e backend's /api root.
# PORT (docker container bind) and SERVER_NAME (Quart config) are derived from
# it so port-overriding (e.g. macOS AirPlay grabs 5000) needs only one export:
#   export SUPERDESK_URL=http://localhost:5002/api
SUPERDESK_URL="${SUPERDESK_URL:-http://localhost:5000/api}"
SERVER_URL="${SUPERDESK_URL%/}/"
CLIENT_URL="http://localhost:9000/"
SUPERDESK_HOST_PORT="$(printf '%s\n' "$SUPERDESK_URL" | sed -E 's#^https?://##; s#/.*$##')"
PORT="${PORT:-${SUPERDESK_HOST_PORT##*:}}"
SERVER_NAME="${SERVER_NAME:-$SUPERDESK_HOST_PORT}"
export SUPERDESK_URL PORT SERVER_NAME

log() { printf '\n[e2e-up] %s\n' "$*"; }
fail() { printf '\n[e2e-up] ERROR: %s\n' "$*" >&2; exit 1; }

reachable() {
    # Any HTTP response counts as "up" — the superdesk e2e server returns 403
    # on /api/ without auth, which is a sign of life, not failure. We only
    # fail on connection-level errors (port closed, host unreachable).
    curl -sS --max-time 2 -o /dev/null "$1" 2>/dev/null
}

wait_until_reachable() {
    local url="$1"
    local name="$2"
    local timeout="${3:-180}"
    local elapsed=0

    until reachable "$url"; do
        if [ "$elapsed" -ge "$timeout" ]; then
            fail "$name not reachable at $url after ${timeout}s"
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done

    log "$name reachable at $url"
}

ensure_deps() {
    local dir="$1"
    if [ "$REINSTALL" = true ] || [ ! -d "$dir/node_modules" ]; then
        log "installing dependencies in $dir"
        (cd "$dir" && npm ci)
    fi
}

# 1. Pre-flight: warn about host port conflicts.
# The e2e/server docker-compose uses `network_mode: "host"`, so mongo (27017),
# redis (6379), and elasticsearch (9200) bind to host ports. If the user has
# local instances of these running, docker compose will fail with port-in-use.
# Worse, if the user has a host-installed mongo with a database named like
# `superdesk_e2e`, the e2e server will operate on it via the shared port.
preflight_check_port() {
    local port="$1"
    local name="$2"
    if command -v lsof > /dev/null && lsof -ti:"$port" > /dev/null 2>&1; then
        # Filter out our own e2e containers if they're already running.
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null)
        if docker compose -p superdesk-client-core_e2e ps -q 2>/dev/null | grep -q .; then
            return 0  # our stack is already up; this is fine
        fi
        cat >&2 <<EOF

[e2e-up] WARNING: Something is already listening on port $port ($name).
[e2e-up] The e2e stack uses host networking, so this is likely your local
[e2e-up] $name instance. docker compose will fail with a port conflict.
[e2e-up] Stop your local $name and re-run, or accept the conflict will
[e2e-up] block the e2e stack.
[e2e-up] PIDs holding port $port: $pids

EOF
        return 1
    fi
    return 0
}

# 2. Server (docker compose)
if reachable "$SERVER_URL"; then
    log "server already reachable; skipping docker bring-up"
else
    preflight_check_port 27017 mongo || true
    preflight_check_port 6379 redis || true
    preflight_check_port 9200 elasticsearch || true
    preflight_check_port "$PORT" "superdesk server" || true

    log "bringing up server via docker compose"
    if [ "$REBUILD" = true ]; then
        (cd "$E2E_SERVER" && docker compose build)
    fi
    (cd "$E2E_SERVER" && docker compose up -d)
    wait_until_reachable "$SERVER_URL" "server" 240
fi

# 2. Dependencies
ensure_deps "$REPO_ROOT"
ensure_deps "$REPO_ROOT/build-tools"
[ -d "$REPO_ROOT/end-to-end-testing-helpers" ] && ensure_deps "$REPO_ROOT/end-to-end-testing-helpers"
ensure_deps "$E2E_CLIENT"

# 3. Client build (only if dist is missing or stale relative to scripts/)
if [ "$REINSTALL" = true ] || [ ! -d "$E2E_CLIENT/dist" ] || [ -z "$(ls -A "$E2E_CLIENT/dist" 2>/dev/null)" ]; then
    log "building client (this is the slow step on a cold cache)"
    (cd "$E2E_CLIENT" && npm run build)
fi

# 4. Client dev server (http-server serving dist on :9000)
if reachable "$CLIENT_URL"; then
    log "client already reachable; skipping client server start"
else
    log "starting client server on $CLIENT_URL"
    (cd "$E2E_CLIENT" && npm run start-client-server)
    wait_until_reachable "$CLIENT_URL" "client" 60
fi

log "ready"
log "  server: $SERVER_URL"
log "  client: $CLIENT_URL"
log "Run e2e tests from $E2E_CLIENT, e.g. \`npm run playwright\`."
