#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
sh "$root/backend/formal/check-tla.sh"
if ! command -v lake >/dev/null 2>&1; then
  echo "check: lake is not on PATH. Install elan, then run this from backend/formal/retry." >&2
  exit 1
fi
( cd "$root/backend/formal/retry" && lake build )
echo "check: TLA+ and the Lean retry table finished."
