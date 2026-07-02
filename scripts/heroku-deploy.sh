#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env.production}"
BACKEND_APP="${HEROKU_BACKEND_APP:-api-command-center}"
FRONTEND_APP="${HEROKU_FRONTEND_APP:-web-command-center}"

if [[ -z "${HEROKU_API_KEY:-}" ]]; then
  echo "Define HEROKU_API_KEY antes de desplegar." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No se encontró ${ENV_FILE}. Cree .env.production en la raíz del proyecto." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "==> Verificando app backend"
"${ROOT_DIR}/scripts/heroku-preflight.sh" "$BACKEND_APP" backend

echo "==> Verificando app frontend"
"${ROOT_DIR}/scripts/heroku-preflight.sh" "$FRONTEND_APP" frontend

echo "==> Sincronizando config del backend"
HEROKU_FRONTEND_APP="$FRONTEND_APP" "${ROOT_DIR}/scripts/heroku-sync-env.sh" "$BACKEND_APP" "$ENV_FILE"

echo "==> Sincronizando config del frontend"
HEROKU_FRONTEND_APP="$FRONTEND_APP" "${ROOT_DIR}/scripts/heroku-sync-env.sh" "$FRONTEND_APP" "$ENV_FILE"

echo "==> Desplegando backend (${BACKEND_APP})"
git subtree split --prefix=backend -b heroku-backend-deploy
git push "https://heroku:${HEROKU_API_KEY}@git.heroku.com/${BACKEND_APP}.git" heroku-backend-deploy:main --force

echo "==> Desplegando frontend (${FRONTEND_APP})"
git subtree split --prefix=frontend -b heroku-frontend-deploy
git push "https://heroku:${HEROKU_API_KEY}@git.heroku.com/${FRONTEND_APP}.git" heroku-frontend-deploy:main --force

echo "Deploy completado."
echo "Backend:  https://${BACKEND_APP}.herokuapp.com"
echo "Frontend: https://${FRONTEND_APP}.herokuapp.com"
