#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:?Usage: heroku-preflight.sh <heroku-app-name> [backend|frontend]}"
ROLE="${2:-app}"

if [[ -z "${HEROKU_API_KEY:-}" ]]; then
  echo "HEROKU_API_KEY no está definida." >&2
  exit 1
fi

echo "==> Cuenta Heroku"
heroku auth:whoami

echo ""
echo "==> Apps accesibles con esta API key"
heroku apps

if ! heroku apps:info --app "$APP_NAME" >/dev/null 2>&1; then
  echo "" >&2
  echo "No se encontró la app '${APP_NAME}' (${ROLE})." >&2
  echo "Configure la variable de repo HEROKU_BACKEND_APP o HEROKU_FRONTEND_APP en GitHub." >&2
  echo "Valores actuales en tu cuenta (ver listado arriba): api-command-center, web-command-center, etc." >&2
  exit 1
fi

WEB_URL="$(heroku apps:info --app "$APP_NAME" | awk -F': ' '/^Web URL/ {print $2}')"

echo ""
echo "==> App verificada (${ROLE})"
echo "  ✓ Nombre CLI: ${APP_NAME}"
echo "  ✓ Web URL:    ${WEB_URL:-https://${APP_NAME}.herokuapp.com/}"
