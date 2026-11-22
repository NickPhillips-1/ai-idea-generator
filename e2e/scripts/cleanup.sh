#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
cd "$root"
docker compose down -v
echo "cleanup: compose project stopped. Evidence under e2e/test-results is left in place."
