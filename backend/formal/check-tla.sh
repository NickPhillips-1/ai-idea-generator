#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname "$0")" && pwd)"

jar="tla2tools.jar"
version="1.7.4"
sha="936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
url="https://github.com/tlaplus/tlaplus/releases/download/v${version}/tla2tools.jar"

if [ ! -f "$jar" ]; then
  curl -fsSL -o "$jar" "$url"
fi
if command -v sha256sum >/dev/null 2>&1; then
  echo "$sha  $jar" | sha256sum -c -
else
  echo "$sha  $jar" | shasum -a 256 -c -
fi

java -jar "$jar" -workers 1 -cleanup -config ResearchJob.cfg ResearchJob.tla

set +e
out=$(java -jar "$jar" -workers 1 -cleanup -config ResearchJobCancel.cfg ResearchJob.tla 2>&1)
code=$?
set -e
printf '%s\n' "$out"
if [ "$code" -eq 0 ]; then
  echo "check-tla: CancelDoesNotPublish held. The known finding disappeared. Read ResearchWorker.execute before treating that as a fix." >&2
  exit 1
fi
printf '%s\n' "$out" | grep -q "Invariant CancelDoesNotPublish is violated." || {
  echo "check-tla: the cancel check failed for a reason other than the known finding." >&2
  exit 1
}
echo "check-tla: invariants held. TLC still finds the cancel-vs-publish counterexample."
