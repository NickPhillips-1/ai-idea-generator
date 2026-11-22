#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
cd "$root"
export FOUNDERSLAB_E2E_LOGIN=true
export FOUNDERSLAB_E2E_FIXTURES=true
export FOUNDER_EMAIL_ALLOWLIST="${FOUNDER_EMAIL_ALLOWLIST:-ada@example.com,grace@example.com}"
docker compose down -v
docker compose up --build -d
base="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:8080}"
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
