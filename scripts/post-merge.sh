#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")/.."

# Restore the exact locked dependencies after a task merge, then verify that
# the merged application can be built.
npm ci --no-audit --no-fund
npm run build

# Do not run db:push here. This project uses a PostgreSQL database shared with
# the VPS, so production schema changes must be reviewed and applied explicitly.
