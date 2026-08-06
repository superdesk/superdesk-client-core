#!/usr/bin/env bash
#
# Bring up the local end-to-end stack: server (docker compose) + client dev
# server. Mirrors what CI's setup-e2e composite action does, with idempotence
# and health checks so the script can be run repeatedly without doing wasted
# work.
#
# Usage (from repo root):
#   ./e2e/scripts/e2e-up.sh                  # bring up the default stack (api :5002, client :9000)
#   ./e2e/scripts/e2e-up.sh --reinstall      # force `npm ci` in every dependency root
#   ./e2e/scripts/e2e-up.sh --rebuild        # force a client rebuild
#   ./e2e/scripts/e2e-up.sh --slot auto      # claim a numbered slot for a parallel instance
#   ./e2e/scripts/e2e-up.sh --slot 3         # bring up slot 3 specifically
#
# Slots (parallel instances):
#   A slot is an isolated e2e instance that shares elastic, redis and mail
#   with every other slot but gets its own backend container, its own mongod
#   (default database names on port 2701<7+N>, because the snapshot restore
#   matches dump folders by database name), an elastic index prefix
#   (sd_e2e_s<N>), a redis DB, a client build and ports. Slot N uses api
#   :501N, websocket :511N, client :901N. Slots exist so several agents can
#   author specs concurrently, one slot per git checkout/worktree.
#
#   Slots are claimed via lock directories under /tmp/superdesk-e2e.
#   `--slot auto` re-enters a slot already claimed by this checkout, else
#   picks the first free one. Release with ./e2e/scripts/e2e-down.sh --slot N.
#
#   On success the slot environment is written to e2e/client/.e2e-slot.env.
#   playwright.config.ts auto-loads that file, so `npx playwright test` run
#   from this checkout targets the slot with no extra setup.
#
# Exits 0 only when both the server (SUPERDESK_URL, default
# http://localhost:5002/api/) and the client (default http://localhost:9000/)
# respond. Otherwise exits non-zero with a clear error message.

set -euo pipefail

REINSTALL=false
REBUILD=false
SLOT="${E2E_SLOT:-}"

while [ $# -gt 0 ]; do
    case "$1" in
        --reinstall) REINSTALL=true ;;
        --rebuild) REBUILD=true ;;
        --slot)
            shift
            [ $# -gt 0 ] || { echo "--slot needs a value: 1-5 or auto" >&2; exit 2; }
            SLOT="$1"
            ;;
        *) echo "unknown argument: $1" >&2; exit 2 ;;
    esac
    shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_CLIENT="$REPO_ROOT/e2e/client"
E2E_SERVER="$REPO_ROOT/e2e/server"

MAX_SLOTS=5
SLOT_LOCK_ROOT="${E2E_SLOT_LOCK_ROOT:-/tmp/superdesk-e2e}"
SERVER_IMAGE="superdesk-client-core-e2e-server:ci"
INFRA_PROJECT="superdesk-client-core_e2e"
# Slot-shared services. Mongo is deliberately NOT here: each slot runs its
# own (see docker-compose.slot.yml), and these three carry no bind mounts,
# so bringing them up from a worktree cannot recreate (and wipe) them.
INFRA_SERVICES="redis elastic mail"

log() { printf '\n[e2e-up] %s\n' "$*"; }
fail() { printf '\n[e2e-up] ERROR: %s\n' "$*" >&2; exit 1; }

# --- slot claiming -----------------------------------------------------------

slot_lock_dir() { echo "$SLOT_LOCK_ROOT/slot-$1.lock"; }
slot_owner() { head -n 1 "$(slot_lock_dir "$1")/owner" 2>/dev/null || true; }

# mkdir is atomic, so two concurrent claims of the same slot cannot both
# succeed. Re-entrant for the checkout that already owns the slot, so
# re-running e2e-up.sh is safe.
claim_slot() {
    local n="$1"
    local lock
    lock="$(slot_lock_dir "$n")"
    mkdir -p "$SLOT_LOCK_ROOT"
    if mkdir "$lock" 2>/dev/null; then
        printf '%s\n' "$REPO_ROOT" > "$lock/owner"
        printf 'claimed %s pid=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$$" >> "$lock/owner"
        return 0
    fi
    [ "$(slot_owner "$n")" = "$REPO_ROOT" ]
}

if [ "$SLOT" = "auto" ]; then
    SLOT=""
    # prefer a slot this checkout already owns, so re-runs do not leak claims
    for n in $(seq 1 "$MAX_SLOTS"); do
        if [ "$(slot_owner "$n")" = "$REPO_ROOT" ]; then SLOT="$n"; break; fi
    done
    if [ -z "$SLOT" ]; then
        for n in $(seq 1 "$MAX_SLOTS"); do
            if claim_slot "$n"; then SLOT="$n"; break; fi
        done
    fi
    [ -n "$SLOT" ] || fail "no free slot (1-$MAX_SLOTS). Inspect $SLOT_LOCK_ROOT for holders; release a stale one with ./e2e/scripts/e2e-down.sh --slot <N>."
    log "using slot $SLOT"
elif [ -n "$SLOT" ]; then
    case "$SLOT" in
        ''|*[!0-9]*) fail "--slot must be 1-$MAX_SLOTS or auto, got: $SLOT" ;;
    esac
    { [ "$SLOT" -ge 1 ] && [ "$SLOT" -le "$MAX_SLOTS" ]; } || fail "--slot must be 1-$MAX_SLOTS, got: $SLOT"
    claim_slot "$SLOT" || fail "slot $SLOT is claimed by $(slot_owner "$SLOT"). If that checkout is done with it, release it: ./e2e/scripts/e2e-down.sh --slot $SLOT"
fi

# --- URL and name derivation -------------------------------------------------

if [ -n "$SLOT" ]; then
    if [ -n "${SUPERDESK_URL:-}" ]; then
        log "note: --slot overrides the ambient SUPERDESK_URL (${SUPERDESK_URL})"
    fi
    PORT=$((5010 + SLOT))
    WSPORT=$((5110 + SLOT))
    CLIENT_PORT=$((9010 + SLOT))
    MONGO_PORT=$((27017 + SLOT))
    SUPERDESK_URL="http://localhost:$PORT/api"
    SUPERDESK_WS_URL="ws://localhost:$WSPORT"
    SERVER_NAME="localhost:$PORT"
    CLIENT_URL="http://localhost:$CLIENT_PORT"
    # Mongo databases keep their default names (the snapshot restore matches
    # dump folders by database name); isolation comes from the per-slot
    # mongod on MONGO_PORT. Elastic is shared, so it isolates by prefix.
    # sd_e2e_s<N> (not superdesk_e2e_s<N>): the elastic flush that runs on
    # every snapshot restore deletes indices matching <prefix>_*, so slot
    # prefixes must not extend the default superdesk_e2e prefix or a default-
    # stack restore would delete slot indices. Same reason the contentapi
    # prefix is sd_e2e_capi_s<N> and not sd_e2e_s<N>_capi.
    ELASTIC_PREFIX="sd_e2e_s$SLOT"
    ELASTIC_CAPI_PREFIX="sd_e2e_capi_s$SLOT"
    # DBs 11-15: the default stack uses redis DB 1, and kombu prefixes fanout
    # channels with the DB number, so distinct DBs isolate notifications too.
    REDIS_URL="redis://localhost:6379/$((10 + SLOT))"
    SLOT_PROJECT="sd-e2e-s$SLOT"
    export SUPERDESK_URL SUPERDESK_WS_URL PORT SERVER_NAME WSPORT CLIENT_URL REDIS_URL
    export MONGO_PORT ELASTIC_PREFIX ELASTIC_CAPI_PREFIX
else
    # SUPERDESK_URL is the single knob: point it at the e2e backend's /api root.
    # PORT (docker container bind) and SERVER_NAME (Quart config) are derived from
    # it so any port override needs only one export:
    #   export SUPERDESK_URL=http://localhost:5003/api
    # Default is 5002, chosen to avoid 5000 (macOS AirPlay answers on it).
    SUPERDESK_URL="${SUPERDESK_URL:-http://localhost:5002/api}"
    SUPERDESK_WS_URL="${SUPERDESK_WS_URL:-}"
    CLIENT_URL="http://localhost:9000"
    CLIENT_PORT=9000
    SUPERDESK_HOST_PORT="$(printf '%s\n' "$SUPERDESK_URL" | sed -E 's#^https?://##; s#/.*$##')"
    PORT="${PORT:-${SUPERDESK_HOST_PORT##*:}}"
    case "$PORT" in
        ''|*[!0-9]*)
            fail "could not derive a numeric backend port from SUPERDESK_URL=\"$SUPERDESK_URL\". Include an explicit port, e.g. http://localhost:5002/api."
            ;;
    esac
    SERVER_NAME="${SERVER_NAME:-$SUPERDESK_HOST_PORT}"
    export SUPERDESK_URL PORT SERVER_NAME
fi

SERVER_URL="${SUPERDESK_URL%/}/"

# Strict HTTP status (echoes the code, or 000 on connection failure). Unlike
# reachable(), this lets callers require a specific code, e.g. a real 200 on a
# bundle rather than "the port answered".
http_status() { curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo "000"; }

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

# The server image has no build: section in either compose file (CI builds and
# saves it), so build it here when it is missing. Rebuilding after changes to
# e2e/server (requirements.txt, Dockerfile) is manual:
#   docker build -t superdesk-client-core-e2e-server:ci e2e/server
ensure_server_image() {
    if ! docker image inspect "$SERVER_IMAGE" > /dev/null 2>&1; then
        log "server image $SERVER_IMAGE not found; building it (one-time, slow)"
        docker build -t "$SERVER_IMAGE" "$E2E_SERVER"
    fi
}

# 1. Pre-flight: warn about host port conflicts.
# The e2e/server compose files use `network_mode: "host"`, so mongo (27017),
# redis (6379), and elasticsearch (9200) bind to host ports. If the user has
# local instances of these running, docker compose will fail with port-in-use.
# Worse, if the user has a host-installed mongo with a database named like
# `superdesk_e2e`, the e2e server will operate on it via the shared port.
preflight_check_port() {
    local port="$1"
    local name="$2"
    local project="${3:-$INFRA_PROJECT}"
    if command -v lsof > /dev/null && lsof -ti:"$port" > /dev/null 2>&1; then
        # Filter out our own e2e containers if they're already running.
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null)
        if docker compose -p "$project" ps -q 2>/dev/null | grep -q .; then
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
if [ -n "$SLOT" ]; then
    ensure_server_image

    # Shared infra services live in the default compose project, so a slot
    # coexists with the default stack and with other slots. --no-recreate
    # guards against compose recreating (and, with tmpfs data, wiping) a
    # running service because a worktree checkout resolves relative paths in
    # the compose file differently.
    if ! docker compose -p "$INFRA_PROJECT" ps -q 2>/dev/null | grep -q .; then
        preflight_check_port 6379 redis || true
        preflight_check_port 9200 elasticsearch || true
    fi
    log "ensuring shared docker services are up ($INFRA_SERVICES)"
    (cd "$E2E_SERVER" && docker compose up -d --no-recreate $INFRA_SERVICES)

    if reachable "$SERVER_URL"; then
        log "slot $SLOT server already reachable; skipping docker bring-up"
    else
        preflight_check_port "$PORT" "superdesk server (slot $SLOT)" "$SLOT_PROJECT" || true
        preflight_check_port "$WSPORT" "websocket server (slot $SLOT)" "$SLOT_PROJECT" || true
        preflight_check_port "$MONGO_PORT" "mongo (slot $SLOT)" "$SLOT_PROJECT" || true
        log "bringing up slot $SLOT server + mongo via docker compose (project $SLOT_PROJECT)"
        (cd "$E2E_SERVER" && docker compose -f docker-compose.slot.yml -p "$SLOT_PROJECT" up -d)
        wait_until_reachable "$SERVER_URL" "server (slot $SLOT)" 240
    fi
else
    if reachable "$SERVER_URL"; then
        log "server already reachable; skipping docker bring-up"
    else
        preflight_check_port 27017 mongo || true
        preflight_check_port 6379 redis || true
        preflight_check_port 9200 elasticsearch || true
        preflight_check_port "$PORT" "superdesk server" || true

        ensure_server_image
        log "bringing up server via docker compose"
        (cd "$E2E_SERVER" && docker compose up -d)
        wait_until_reachable "$SERVER_URL" "server" 240
    fi
fi

# 2. Dependencies
ensure_deps "$REPO_ROOT"
ensure_deps "$REPO_ROOT/build-tools"
ensure_deps "$E2E_CLIENT"

# 3. Client build.
# Rebuild when forced, deps reinstalled, the app bundles are missing, OR the
# dist was built against different backend URLs. The last two matter because:
#   - a failed/partial build leaves a non-empty dist/ WITHOUT the bundles, so
#     "is dist empty?" is not a sufficient staleness test;
#   - the backend api and websocket URLs are baked into the bundle at build
#     time (webpack DefinePlugin), so a dist built for one slot silently
#     breaks on another.
REQUIRED_BUNDLES="app.bundle.js init.bundle.js app.bundle.css"
BUILD_META="$E2E_CLIENT/dist/.e2e-built-with"

client_build_complete() {
    for b in $REQUIRED_BUNDLES; do
        [ -f "$E2E_CLIENT/dist/$b" ] || return 1
    done
    return 0
}
build_meta_current() { printf '%s\n%s\n' "$SUPERDESK_URL" "${SUPERDESK_WS_URL:-}"; }
build_url_matches() {
    [ -f "$BUILD_META" ] && [ "$(cat "$BUILD_META" 2>/dev/null)" = "$(build_meta_current)" ]
}

if [ "$REBUILD" = true ] || [ "$REINSTALL" = true ] || ! client_build_complete || ! build_url_matches; then
    if ! client_build_complete; then
        log "client bundles missing or incomplete; (re)building client"
    elif ! build_url_matches; then
        log "dist was built for different backend URLs; rebuilding for $SUPERDESK_URL"
    else
        log "building client (this is the slow step on a cold cache)"
    fi
    (cd "$E2E_CLIENT" && SUPERDESK_URL="$SUPERDESK_URL" SUPERDESK_WS_URL="${SUPERDESK_WS_URL:-}" npm run build)
    client_build_complete || fail "client build finished but the app bundles are missing from dist/ ($REQUIRED_BUNDLES). The build failed; re-read the build output above and re-run with --rebuild."
    build_meta_current > "$BUILD_META"
    log "client build complete (backend baked as $SUPERDESK_URL)"
fi

# 4. Client dev server (http-server serving dist on $CLIENT_PORT)
if reachable "$CLIENT_URL/"; then
    log "client already reachable; skipping client server start"
else
    if [ -n "$SLOT" ]; then
        preflight_check_port "$CLIENT_PORT" "client server (slot $SLOT)" "$SLOT_PROJECT" || true
    fi
    log "starting client server on $CLIENT_URL/"
    (cd "$E2E_CLIENT" && CLIENT_PORT="$CLIENT_PORT" npm run start-client-server)
    wait_until_reachable "$CLIENT_URL/" "client" 60
fi

# Final health gate: the app entry bundle must actually be served with a 200.
# A 200 on / (index.html) is returned even when the bundles 404 -> blank page.
# This is the difference between "the port answers" and "the app works".
bundle_status="$(http_status "$CLIENT_URL/app.bundle.js")"
if [ "$bundle_status" != "200" ]; then
    fail "client is up but app.bundle.js returns HTTP $bundle_status, the app would render blank. The build is incomplete; re-run: ./e2e/scripts/e2e-up.sh --rebuild"
fi

# 5. Slot hand-off: per-slot auth state and environment file.
if [ -n "$SLOT" ]; then
    # The committed storageState keeps the admin session in localStorage keyed
    # to the origin http://localhost:9000. A slot client is a different origin,
    # so write a copy with the origin rewritten or every spec starts logged out.
    (cd "$E2E_CLIENT" && SLOT_ORIGIN="$CLIENT_URL" node -e '
        const fs = require("fs");
        const data = JSON.parse(fs.readFileSync("playwright/.auth/user.json", "utf-8"));
        for (const origin of data.origins || []) {
            origin.origin = origin.origin.replace("http://localhost:9000", process.env.SLOT_ORIGIN);
        }
        fs.writeFileSync("playwright/.auth/user.slot.json", JSON.stringify(data, null, 4) + "\n");
    ')

    cat > "$E2E_CLIENT/.e2e-slot.env" <<EOF
E2E_SLOT=$SLOT
SUPERDESK_URL=$SUPERDESK_URL
SUPERDESK_WS_URL=$SUPERDESK_WS_URL
CLIENT_URL=$CLIENT_URL
CLIENT_PORT=$CLIENT_PORT
PLAYWRIGHT_STORAGE_STATE=playwright/.auth/user.slot.json
PLAYWRIGHT_HTML_OPEN=never
EOF
    log "slot environment written to e2e/client/.e2e-slot.env (auto-loaded by playwright.config.ts)"
else
    # A leftover slot env file would silently redirect playwright at a slot
    # stack; the default stack must not inherit it.
    rm -f "$E2E_CLIENT/.e2e-slot.env"
fi

log "ready"
if [ -n "$SLOT" ]; then
    log "  slot:   $SLOT (release with ./e2e/scripts/e2e-down.sh --slot $SLOT)"
fi
log "  server: $SERVER_URL"
log "  client: $CLIENT_URL/"
log "Run e2e tests from $E2E_CLIENT, e.g. \`npm run playwright\`."
