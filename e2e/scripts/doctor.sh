#!/bin/sh
set -eu
http_port="${FOUNDERS_HTTP_PORT:-8080}"
base="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:${http_port}}"
base="${base%/}"
project="${COMPOSE_PROJECT_NAME:-directory default}"
echo "doctor: project ${project}"

if ! curl -sf "$base/v3/api-docs" >/dev/null; then
  echo "doctor: OpenAPI is not up at $base/v3/api-docs" >&2
  exit 1
fi
if ! curl -sf "$base/" >/dev/null; then
  echo "doctor: the app is not up at $base/" >&2
  exit 1
fi

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$base/e2e/login?email=ada@example.com")
if [ "$code" = "404" ]; then
  echo "doctor: POST /e2e/login returned 404. Restart with FOUNDERSLAB_E2E_LOGIN=true. This is the Google stack, not the verification stack." >&2
  exit 1
fi

echo "doctor: ok ($base, POST /e2e/login status $code)"
