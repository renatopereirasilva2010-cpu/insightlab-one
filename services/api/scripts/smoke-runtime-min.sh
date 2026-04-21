#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${ROOT_DIR}/.smoke-runtime.log"

cleanup() {
  if [[ -n "${APP_PID:-}" ]] && kill -0 "${APP_PID}" 2>/dev/null; then
    kill "${APP_PID}" 2>/dev/null || true
    wait "${APP_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

cd "${ROOT_DIR}"

DB_TARGET="$(grep -m1 '^DATABASE_URL=' .env 2>/dev/null | cut -d= -f2- || echo 'DATABASE_URL atual')"

pnpm build >/dev/null

: > "${LOG_FILE}"
node dist/src/main.js >"${LOG_FILE}" 2>&1 &
APP_PID=$!

sleep 5

if curl -sS -o /dev/null --max-time 5 http://127.0.0.1:4000/v1/clients; then
  echo "SMOKE_STATUS=PASS"
  echo "SMOKE_DETAIL=runtime respondeu em http://127.0.0.1:4000/v1/clients"
  exit 0
fi

if grep -q "Can't reach database server at \`" "${LOG_FILE}"; then
  echo "SMOKE_STATUS=FAIL"
  echo "SMOKE_DETAIL=runtime bloqueado por PostgreSQL indisponivel na DATABASE_URL atual (${DB_TARGET})"
  exit 1
fi

echo "SMOKE_STATUS=FAIL"
echo "SMOKE_DETAIL=runtime nao respondeu em http://127.0.0.1:4000/v1/clients"
echo "SMOKE_LOG=${LOG_FILE}"
exit 1
