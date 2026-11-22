#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
cd "$root"
export FOUNDERSLAB_E2E_LOGIN=true
export FOUNDERSLAB_E2E_FIXTURES=true
export FOUNDER_EMAIL_ALLOWLIST="${FOUNDER_EMAIL_ALLOWLIST:-ada@example.com,grace@example.com}"
export FOUNDERS_HTTP_PORT="${FOUNDERS_HTTP_PORT:-8080}"
export POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-5433}"
if [ -z "${PLAYWRIGHT_BASE_URL:-}" ]; then
  PLAYWRIGHT_BASE_URL="http://127.0.0.1:${FOUNDERS_HTTP_PORT}"
fi
export PLAYWRIGHT_BASE_URL
project="${COMPOSE_PROJECT_NAME:-$(basename "$root")}"
echo "launch: project ${project} at ${PLAYWRIGHT_BASE_URL} (postgres host port ${POSTGRES_HOST_PORT})"
docker compose down -v
docker compose up --build -d
base="${PLAYWRIGHT_BASE_URL}"
base="${base%/}"
i=1
while [ "$i" -le 60 ]; do
  if curl -sf "$base/v3/api-docs" >/dev/null && curl -sf "$base/" >/dev/null; then
    echo "launch: ready at $base"
    exit 0
  fi
  sleep 5
  i=$((i + 1))
done
echo "launch: timed out waiting for $base" >&2
exit 1
