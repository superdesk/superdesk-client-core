#!/usr/bin/env bash
#
# Tear down the local end-to-end stack started by e2e-up.sh.
#
# Usage (from repo root):
#   ./e2e/scripts/e2e-down.sh                # stop the default stack (api :5002, client :9000)
#   ./e2e/scripts/e2e-down.sh --volumes      # also remove docker volumes (drops DB state)
#   ./e2e/scripts/e2e-down.sh --slot N       # tear down slot N and release its lock
#   ./e2e/scripts/e2e-down.sh --all          # tear down every slot, the default stack and shared services
#
# While any slot is active, the no-argument form stops only the default
# backend and client and leaves the shared docker services (elastic, redis,
# mail) running, because slots depend on them. Each slot's own mongod goes
# down with its slot project. Use --all to take
# everything down.
#
# Always exits 0 even if some pieces were already stopped — the script is
# idempotent.

set -euo pipefail

VOLUMES=false
ALL=false
SLOT=""

while [ $# -gt 0 ]; do
    case "$1" in
        --volumes) VOLUMES=true ;;
        --all) ALL=true ;;
        --slot)
            shift
            [ $# -gt 0 ] || { echo "--slot needs a value (1-5)" >&2; exit 2; }
            SLOT="$1"
            ;;
        *) echo "unknown argument: $1" >&2; exit 2 ;;
    esac
    shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_SERVER="$REPO_ROOT/e2e/server"

MAX_SLOTS=5
SLOT_LOCK_ROOT="${E2E_SLOT_LOCK_ROOT:-/tmp/superdesk-e2e}"

log() { printf '\n[e2e-down] %s\n' "$*"; }

# Kill anything listening on the given port. `lsof -ti` works on macOS and
# Linux. Suppress errors when nothing is listening.
kill_port() {
    local port="$1"
    local name="$2"
    if command -v lsof > /dev/null; then
        if pids=$(lsof -ti:"$port" 2>/dev/null); then
            log "stopping $name (PIDs: $pids)"
            kill $pids 2>/dev/null || true
        fi
    fi
}

active_slots() {
    ls "$SLOT_LOCK_ROOT" 2>/dev/null | sed -n 's/^slot-\([0-9][0-9]*\)\.lock$/\1/p' | sort -n
}

down_slot() {
    local n="$1"
    local project="sd-e2e-s$n"
    log "tearing down slot $n (project $project)"
    kill_port $((9010 + n)) "slot $n client server"
    # Project-only down: no -f, so compose finds the containers by project
    # label without interpolating docker-compose.slot.yml (whose required
    # variables are not set here). cd to / so no local compose file is
    # picked up implicitly.
    if ! (cd / && docker compose -p "$project" down --remove-orphans > /dev/null 2>&1); then
        docker ps -aq --filter "label=com.docker.compose.project=$project" \
            | xargs docker rm -f 2>/dev/null || true
    fi
    # Remove the slot env file from the checkout that claimed the slot (which
    # is not necessarily the one this script runs from).
    local owner
    owner="$(head -n 1 "$SLOT_LOCK_ROOT/slot-$n.lock/owner" 2>/dev/null || true)"
    if [ -n "$owner" ]; then
        rm -f "$owner/e2e/client/.e2e-slot.env"
    fi
    rm -rf "${SLOT_LOCK_ROOT:?}/slot-$n.lock"
}

down_default_stack() {
    kill_port 9000 "client server"
    if [ ! -f "$E2E_SERVER/docker-compose.yml" ]; then
        log "no $E2E_SERVER/docker-compose.yml; nothing to tear down"
        return
    fi
    if [ "$VOLUMES" = true ]; then
        log "docker compose down -v (volumes removed; DB state dropped)"
        (cd "$E2E_SERVER" && docker compose down -v)
    else
        log "docker compose down"
        (cd "$E2E_SERVER" && docker compose down)
    fi
}

if [ -n "$SLOT" ]; then
    case "$SLOT" in
        ''|*[!0-9]*) echo "--slot must be 1-$MAX_SLOTS, got: $SLOT" >&2; exit 2 ;;
    esac
    down_slot "$SLOT"
    log "done"
    exit 0
fi

if [ "$ALL" = true ]; then
    for n in $(seq 1 "$MAX_SLOTS"); do
        if [ -d "$SLOT_LOCK_ROOT/slot-$n.lock" ] \
            || docker ps -aq --filter "label=com.docker.compose.project=sd-e2e-s$n" 2>/dev/null | grep -q .; then
            down_slot "$n"
        fi
    done
    down_default_stack
    log "done"
    exit 0
fi

slots="$(active_slots)"
if [ -n "$slots" ]; then
    # Slots share elastic/redis/mail with the default stack, so taking the
    # whole compose project down would pull the rug out from under them.
    log "active slots ($(echo $slots | tr '\n' ' ')) depend on the shared docker services; stopping only the default server and client"
    log "use --all to tear down everything including slots"
    kill_port 9000 "client server"
    (cd "$E2E_SERVER" && docker compose rm -sf server > /dev/null 2>&1) || true
else
    down_default_stack
fi

log "done"
