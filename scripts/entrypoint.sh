#!/bin/sh
set -e

echo "=== Starting Meetingroom App ==="

mkdir -p /app/data/uploads /app/backups

echo "Setting up database..."
npx prisma generate
npx prisma migrate deploy

echo "Starting Next.js application..."
echo "PORT is set to: ${PORT}"
exec npm start
