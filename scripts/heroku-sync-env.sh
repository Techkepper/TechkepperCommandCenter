#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:?Usage: heroku-sync-env.sh <heroku-app-name> [env-file]}"
ENV_FILE="${2:-.env.production}"
FRONTEND_APP="${HEROKU_FRONTEND_APP:-web-command-center}"
BATCH_SIZE="${HEROKU_CONFIG_BATCH_SIZE:-20}"
MAX_RETRIES="${HEROKU_CONFIG_MAX_RETRIES:-5}"

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

run_heroku_config_set() {
  local attempt=1
  local wait_seconds=30
  local output=""

  while (( attempt <= MAX_RETRIES )); do
    if output="$(heroku config:set "$@" --app "$APP_NAME" 2>&1)"; then
      return 0
    fi

    if [[ "$output" == *rate_limit* || "$output" == *"API rate limit"* ]]; then
      echo "  ⏳ Rate limit de Heroku (intento ${attempt}/${MAX_RETRIES}). Esperando ${wait_seconds}s..." >&2
      sleep "$wait_seconds"
      attempt=$((attempt + 1))
      wait_seconds=$((wait_seconds + 30))
      continue
    fi

    echo "$output" >&2
    return 1
  done

  echo "Rate limit de Heroku persistente. Espere unos minutos y vuelva a ejecutar el workflow." >&2
  return 1
}

config_args=()
config_keys=()

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

  config_args+=("${key}=${value}")
  config_keys+=("$key")
done < "$ENV_FILE"

if ((${#config_args[@]} == 0)); then
  echo "No hay variables para sincronizar en ${ENV_FILE}." >&2
  exit 1
fi

echo "Sincronizando ${#config_args[@]} variables de ${ENV_FILE} → Heroku app ${APP_NAME}..."

for ((offset = 0; offset < ${#config_args[@]}; offset += BATCH_SIZE)); do
  batch=("${config_args[@]:offset:BATCH_SIZE}")
  batch_num=$((offset / BATCH_SIZE + 1))
  batch_total=$(( (${#config_args[@]} + BATCH_SIZE - 1) / BATCH_SIZE ))

  echo "  Lote ${batch_num}/${batch_total} (${#batch[@]} vars)..."
  run_heroku_config_set "${batch[@]}"
done

for key in "${config_keys[@]}"; do
  echo "  ✓ ${key}"
done

echo "Configuración sincronizada."
