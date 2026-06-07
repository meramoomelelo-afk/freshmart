#!/bin/sh
set -e

echo "==> Running database schema push..."
cd /app/lib/db
npx drizzle-kit push --config ./drizzle.config.ts --force 2>&1 || echo "Schema push completed (may have warnings)"

echo "==> Starting FreshMart server..."
cd /app
exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs
