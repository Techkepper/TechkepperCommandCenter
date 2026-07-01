#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:?Usage: heroku-sync-env.sh <heroku-app-name> [env-file]}"
ENV_FILE="${2:-.env.production}"
FRONTEND_APP="${HEROKU_FRONTEND_APP:-web-command-center-e0b9cd1e60e4}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No se encontró el archivo de entorno: $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${HEROKU_API_KEY:-}" ]]; then
  echo "HEROKU_API_KEY no está definida." >&2
  exit 1
fi

IS_FRONTEND=false
if [[ "$APP_NAME" == "$FRONTEND_APP" ]]; then
  IS_FRONTEND=true
fi

SKIP_VARS=(
  COMPOSE_PROFILES
  MYSQL_ENGINE
  MYSQL_VERSION
  MYSQL_ROOT_PASSWORD
  MYSQL_DATABASE
  MYSQL_PORT
  BACKEND_PORT
  FRONTEND_PORT
  FRONTEND_SSL_PORT
  FRONTEND_SERVER_NAME
  VITE_DEV_BACKEND_URL
  TZ
)

should_skip() {
  local key="$1"
  local skip

  for skip in "${SKIP_VARS[@]}"; do
    if [[ "$key" == "$skip" ]]; then
      return 0
    fi
  done

  if [[ "$IS_FRONTEND" == true && "$key" != VITE_* ]]; then
    return 0
  fi

  if [[ "$IS_FRONTEND" == false && "$key" == VITE_* ]]; then
    return 0
  fi

  return 1
}

echo "Sincronizando variables de ${ENV_FILE} → Heroku app ${APP_NAME}..."

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"

  [[ -z "$line" || "$line" == \#* ]] && continue
  [[ "$line" != *=* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  [[ -z "$value" ]] && continue

  if should_skip "$key"; then
    continue
  fi

  heroku config:set "${key}=${value}" --app "$APP_NAME" --overwrite >/dev/null
  echo "  ✓ ${key}"
done < "$ENV_FILE"

echo "Configuración sincronizada."
