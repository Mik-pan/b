#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; cannot start Prisma." >&2
  exit 1
fi

if [ ! -f "./prisma/schema.prisma" ]; then
  echo "Missing prisma/schema.prisma in image; cannot run migrations." >&2
  exit 1
fi

if [ ! -x "./node_modules/.bin/prisma" ]; then
  echo "Prisma CLI not found (./node_modules/.bin/prisma); cannot run migrations." >&2
  exit 1
fi

./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma

exec "$@"

