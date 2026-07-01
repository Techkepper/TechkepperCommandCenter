#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Deteniendo contenedores y borrando volúmenes de MySQL..."
docker compose down -v

echo "Reconstruyendo e iniciando servicios..."
docker compose build backend
docker compose up -d

echo ""
echo "Listo. El backend aplica la migración baseline y los seeds al arrancar."
echo "Frontend: http://localhost:3002 (o el puerto configurado en docker-compose)"
echo "Backend:  http://localhost:8081"
echo ""
echo "Logs del backend:"
docker compose logs -f backend
