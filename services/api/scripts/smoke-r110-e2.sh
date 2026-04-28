#!/usr/bin/env bash
set -euo pipefail

API_URL="http://localhost:4000"
LOGIN_EMAIL="admin@mix-demo.local"
LOGIN_PASSWORD="Admin@12345"
MARKER="r110e2$(date +%Y%m%d%H%M%S)-$$"

HTTP_STATUS=""
HTTP_BODY=""
TMP_BODY_FILE="$(mktemp)"
SMOKE_STATUS="FAIL"

PRODUCT_ID=""
SUPPLY_ID=""
RESOURCE_ID=""
UNIT_CONVERSION_ID=""
PRODUCT_COUNT=""
SUPPLY_COUNT=""
RESOURCE_COUNT=""
UNIT_CONVERSION_COUNT=""

cleanup() {
  rm -f "${TMP_BODY_FILE}"
}

finish() {
  local exit_code=$?
  if [[ "${exit_code}" -eq 0 ]]; then
    SMOKE_STATUS="PASS"
  fi

  echo
  echo "===== RESUMO FINAL ====="
  echo "SMOKE_STATUS=${SMOKE_STATUS}"
  echo "API_URL=${API_URL}"
  echo "MARKER=${MARKER}"
  echo "PRODUCT_ID=${PRODUCT_ID:-n/a}"
  echo "SUPPLY_ID=${SUPPLY_ID:-n/a}"
  echo "RESOURCE_ID=${RESOURCE_ID:-n/a}"
  echo "UNIT_CONVERSION_ID=${UNIT_CONVERSION_ID:-n/a}"
  echo "PRODUCT_COUNT=${PRODUCT_COUNT:-n/a}"
  echo "SUPPLY_COUNT=${SUPPLY_COUNT:-n/a}"
  echo "RESOURCE_COUNT=${RESOURCE_COUNT:-n/a}"
  echo "UNIT_CONVERSION_COUNT=${UNIT_CONVERSION_COUNT:-n/a}"

  cleanup
  exit "${exit_code}"
}

trap finish EXIT

require_bin() {
  local bin="$1"
  if ! command -v "${bin}" >/dev/null 2>&1; then
    echo "ERRO: dependencia obrigatoria ausente: ${bin}"
    exit 1
  fi
}

call_api() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local token="${4:-}"

  local response
  if [[ -n "${data}" && -n "${token}" ]]; then
    response="$(
      curl -sS -X "${method}" "${url}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "${data}" \
        -w $'\n%{http_code}'
    )"
  elif [[ -n "${data}" ]]; then
    response="$(
      curl -sS -X "${method}" "${url}" \
        -H "Content-Type: application/json" \
        -d "${data}" \
        -w $'\n%{http_code}'
    )"
  elif [[ -n "${token}" ]]; then
    response="$(
      curl -sS -X "${method}" "${url}" \
        -H "Authorization: Bearer ${token}" \
        -w $'\n%{http_code}'
    )"
  else
    response="$(
      curl -sS -X "${method}" "${url}" \
        -w $'\n%{http_code}'
    )"
  fi

  HTTP_STATUS="${response##*$'\n'}"
  HTTP_BODY="${response%$'\n'*}"
  printf '%s' "${HTTP_BODY}" > "${TMP_BODY_FILE}"
}

assert_status() {
  local expected="$1"
  if [[ "${HTTP_STATUS}" != "${expected}" ]]; then
    echo "ERRO: status HTTP inesperado. Recebido: ${HTTP_STATUS} | Esperado: ${expected}"
    cat "${TMP_BODY_FILE}"
    exit 1
  fi
}

assert_status_any() {
  local actual="${HTTP_STATUS}"
  shift

  for expected in "$@"; do
    if [[ "${actual}" == "${expected}" ]]; then
      return 0
    fi
  done

  echo "ERRO: status HTTP inesperado. Recebido: ${actual} | Esperado: $*"
  cat "${TMP_BODY_FILE}"
  exit 1
}

json_get() {
  local field_name="$1"
  python3 - "${TMP_BODY_FILE}" "${field_name}" <<'PYJSONFIELD'
import json
import sys

path, field_name = sys.argv[1], sys.argv[2]

with open(path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

value = data.get(field_name, "")
if value is None:
    value = ""

if isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
else:
    print(value)
PYJSONFIELD
}

json_array_length() {
  python3 - "${TMP_BODY_FILE}" <<'PYJSONLEN'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)

print(len(data) if isinstance(data, list) else 0)
PYJSONLEN
}

show_json() {
  python3 -m json.tool "${TMP_BODY_FILE}" 2>/dev/null || cat "${TMP_BODY_FILE}"
}

echo "===== PRE-CHECK ====="
require_bin curl
require_bin python3
echo "API_URL=${API_URL}"
echo "LOGIN_EMAIL=${LOGIN_EMAIL}"
echo "MARKER=${MARKER}"

echo
echo "===== CHECKPOINT 1 | LOGIN ====="
call_api "POST" "${API_URL}/v1/auth/login" "{\"email\":\"${LOGIN_EMAIL}\",\"password\":\"${LOGIN_PASSWORD}\"}"
assert_status_any 200 201
show_json

ACCESS_TOKEN="$(json_get 'accessToken')"
if [[ -z "${ACCESS_TOKEN}" || "${ACCESS_TOKEN}" == "null" ]]; then
  echo "ERRO: accessToken nao retornado no login."
  exit 1
fi

echo
echo "===== CHECKPOINT 2 | CRIAR PRODUCT ====="
PRODUCT_PAYLOAD='{"name":"Produto Smoke '"${MARKER}"'","sku":"SKU-'"${MARKER}"'","salePrice":10.5,"cost":6.25}'
call_api "POST" "${API_URL}/v1/products" "${PRODUCT_PAYLOAD}" "${ACCESS_TOKEN}"
assert_status_any 200 201
show_json

PRODUCT_ID="$(json_get 'id')"
if [[ -z "${PRODUCT_ID}" || "${PRODUCT_ID}" == "null" ]]; then
  echo "ERRO: product criado sem id."
  exit 1
fi

echo
echo "===== CHECKPOINT 3 | CRIAR SUPPLY ====="
SUPPLY_PAYLOAD='{"name":"Supply Smoke '"${MARKER}"'","baseUnit":"ml","operationalUnit":"dose","unitCost":3.4}'
call_api "POST" "${API_URL}/v1/supplies" "${SUPPLY_PAYLOAD}" "${ACCESS_TOKEN}"
assert_status_any 200 201
show_json

SUPPLY_ID="$(json_get 'id')"
if [[ -z "${SUPPLY_ID}" || "${SUPPLY_ID}" == "null" ]]; then
  echo "ERRO: supply criado sem id."
  exit 1
fi

echo
echo "===== CHECKPOINT 4 | CRIAR RESOURCE ====="
RESOURCE_PAYLOAD='{"name":"Resource Smoke '"${MARKER}"'","type":"ROOM","description":"Smoke R1.10 E2 '"${MARKER}"'"}'
call_api "POST" "${API_URL}/v1/resources" "${RESOURCE_PAYLOAD}" "${ACCESS_TOKEN}"
assert_status_any 200 201
show_json

RESOURCE_ID="$(json_get 'id')"
if [[ -z "${RESOURCE_ID}" || "${RESOURCE_ID}" == "null" ]]; then
  echo "ERRO: resource criado sem id."
  exit 1
fi

echo
echo "===== CHECKPOINT 5 | CRIAR UNIT-CONVERSION ====="
UNIT_CONVERSION_PAYLOAD='{"supplyItemId":"'"${SUPPLY_ID}"'","fromUnit":"ml","toUnit":"dose","factor":5,"roundingRule":"HALF_UP"}'
call_api "POST" "${API_URL}/v1/unit-conversions" "${UNIT_CONVERSION_PAYLOAD}" "${ACCESS_TOKEN}"
assert_status_any 200 201
show_json

UNIT_CONVERSION_ID="$(json_get 'id')"
if [[ -z "${UNIT_CONVERSION_ID}" || "${UNIT_CONVERSION_ID}" == "null" ]]; then
  echo "ERRO: unit-conversion criada sem id."
  exit 1
fi

echo
echo "===== CHECKPOINT 6 | LISTAR /v1/products ====="
call_api "GET" "${API_URL}/v1/products" "" "${ACCESS_TOKEN}"
assert_status 200
show_json
PRODUCT_COUNT="$(json_array_length)"

echo
echo "===== CHECKPOINT 7 | LISTAR /v1/supplies ====="
call_api "GET" "${API_URL}/v1/supplies" "" "${ACCESS_TOKEN}"
assert_status 200
show_json
SUPPLY_COUNT="$(json_array_length)"

echo
echo "===== CHECKPOINT 8 | LISTAR /v1/resources ====="
call_api "GET" "${API_URL}/v1/resources" "" "${ACCESS_TOKEN}"
assert_status 200
show_json
RESOURCE_COUNT="$(json_array_length)"

echo
echo "===== CHECKPOINT 9 | LISTAR /v1/unit-conversions ====="
call_api "GET" "${API_URL}/v1/unit-conversions" "" "${ACCESS_TOKEN}"
assert_status 200
show_json
UNIT_CONVERSION_COUNT="$(json_array_length)"
