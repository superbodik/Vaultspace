#!/bin/sh
set -e

echo "[entrypoint] applying migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "[entrypoint] seeding (no-op if already seeded)..."
  npx tsx prisma/seed.ts || echo "[entrypoint] seed step failed, continuing anyway"
fi

echo "[entrypoint] starting API..."
exec node dist/main.js
