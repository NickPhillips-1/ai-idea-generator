#!/bin/sh
set -eu
base="${1:-HEAD}"
git diff "$base"...HEAD | git patch-id --stable | awk '{print $1}'
