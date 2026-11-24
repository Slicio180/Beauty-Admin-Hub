#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node tests/queue-regression.cjs
node tests/speed-queue.cjs
node tests/speed-sheets.cjs
