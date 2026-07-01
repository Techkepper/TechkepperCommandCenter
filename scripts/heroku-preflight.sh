#!/usr/bin/env bash
set -euo pipefail

BACKEND_APP="${1:?Usage: heroku-preflight.sh <backend-app> <frontend-app>}"
FRONTEND_APP="${2:?Usage: heroku-preflight.sh <backend-app> <frontend-app>}"

if [[ -z "${HEROKU_API_KEY:-}" ]]; then
  echo "HEROKU_API_KEY no está definida." >&2
  exit 1
fi

echo "==> Cuenta Heroku"
heroku auth:whoami

echo ""
echo "==> Apps accesibles con esta API key"
heroku apps

verify_app() {
  local app="$1"
  local role="$2"

  if ! heroku apps:info --app "$app" >/dev/null 2>&1; then
    echo "" >&2
    echo "No se encontró la app de ${role}: '${app}'" >&2
    echo "Verifique que HEROKU_API_KEY pertenece a la cuenta dueña de las apps." >&2
    echo "Si el nombre es distinto, configure las variables de repo HEROKU_BACKEND_APP y HEROKU_FRONTEND_APP." >&2
    exit 1
  fi

  echo "  ✓ ${role}: ${app}"
}

echo ""
echo "==> Verificando apps del deploy"
verify_app "$BACKEND_APP" "backend"
verify_app "$FRONTEND_APP" "frontend"
