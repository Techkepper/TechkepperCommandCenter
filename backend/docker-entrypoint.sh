#!/bin/sh
set -e

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
dockerize -wait "tcp://${DB_HOST}:${DB_PORT}" -timeout 120s

echo "Running database migrations..."
npx sequelize db:migrate

echo "Running database seeds..."
npx sequelize db:seed:all

echo "Starting application..."
exec node dist/server.js
