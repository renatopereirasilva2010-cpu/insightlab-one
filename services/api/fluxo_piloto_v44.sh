#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/insightlab-one/workspace/services/api || exit 1

API_URL="http://localhost:4000"
MARKER="pilot$(date +%Y%m%d%H%M%S)"

HTTP_STATUS=""
HTTP_BODY=""

call_api() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local token="${4:-}"

  local response
  if [ -n "$data" ] && [ -n "$token" ]; then
    response=$(curl -sS -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data" \
      -w '\n%{http_code}')
  elif [ -n "$data" ]; then
    response=$(curl -sS -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w '\n%{http_code}')
  elif [ -n "$token" ]; then
    response=$(curl -sS -X "$method" "$url" \
      -H "Authorization: Bearer $token" \
      -w '\n%{http_code}')
  else
    response=$(curl -sS -X "$method" "$url" \
      -w '\n%{http_code}')
  fi

  HTTP_STATUS="${response##*$'\n'}"
  HTTP_BODY="${response%$'\n'*}"
}

print_json() {
  printf '%s\n' "$HTTP_BODY" | python3 -m json.tool || printf '%s\n' "$HTTP_BODY"
}

assert_status_any() {
  local actual="$1"
  shift
  local ok="0"
  for expected in "$@"; do
    if [ "$actual" = "$expected" ]; then
      ok="1"
      break
    fi
  done

  if [ "$ok" != "1" ]; then
    echo
    echo "ERRO: status HTTP inesperado: $actual | esperados: $*"
    print_json
    exit 1
  fi
}

json_get() {
  local expr="$1"
  printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print($expr)"
}

echo
echo "===== CHECK 0 | LOGIN FRESCO ====="
call_api "POST" "$API_URL/v1/auth/login" '{"email":"admin@mix-demo.local","password":"Admin@12345"}'
assert_status_any "$HTTP_STATUS" 200 201
print_json

ACCESS_TOKEN="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken',''))")"
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "None" ]; then
  echo "ERRO: accessToken veio vazio."
  exit 1
fi

echo
echo "===== CHECK 1 | CLIENTE ====="
call_api "GET" "$API_URL/v1/clients" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200
print_json

CLIENT_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data,list) and data else '')")"
if [ -z "$CLIENT_ID" ]; then
  echo "ERRO: CLIENT_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 2 | PROFISSIONAL ====="
call_api "GET" "$API_URL/v1/professionals" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200
print_json

PROFESSIONAL_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data,list) and data else '')")"
if [ -z "$PROFESSIONAL_ID" ]; then
  echo "ERRO: PROFESSIONAL_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 3 | SERVIÇO ====="
call_api "GET" "$API_URL/v1/services-catalog" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200
print_json

SERVICE_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data,list) and data else '')")"

if [ -z "$SERVICE_ID" ]; then
  echo
  echo "Nenhum serviço encontrado. Criando serviço mínimo de smoke..."
  SERVICE_CREATE_PAYLOAD=$(cat <<EOF
{"name":"Servico Smoke ${MARKER}","durationMinutes":60,"price":89.9,"availableOnline":true}
EOF
)
  call_api "POST" "$API_URL/v1/services-catalog" "$SERVICE_CREATE_PAYLOAD" "$ACCESS_TOKEN"
  assert_status_any "$HTTP_STATUS" 200 201
  print_json

  SERVICE_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))")"
fi

if [ -z "$SERVICE_ID" ]; then
  echo "ERRO: SERVICE_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 4 | MONTAR JANELA DO APPOINTMENT ====="
readarray -t APPT_TIMES < <(python3 - <<'PY'
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

tz = ZoneInfo("America/Sao_Paulo")
start = (datetime.now(tz) + timedelta(days=10, minutes=2)).replace(second=0, microsecond=0)
end = start + timedelta(hours=1)
print(start.isoformat())
print(end.isoformat())
PY
)

START_AT="${APPT_TIMES[0]}"
END_AT="${APPT_TIMES[1]}"

echo "START_AT=$START_AT"
echo "END_AT=$END_AT"

echo
echo "===== CHECK 5 | CRIAR APPOINTMENT ====="
APPOINTMENT_CREATE_PAYLOAD=$(cat <<EOF
{
  "clientId":"$CLIENT_ID",
  "professionalId":"$PROFESSIONAL_ID",
  "serviceId":"$SERVICE_ID",
  "startAt":"$START_AT",
  "endAt":"$END_AT",
  "notes":"Fluxo piloto V44 $MARKER"
}
EOF
)

call_api "POST" "$API_URL/v1/appointments" "$APPOINTMENT_CREATE_PAYLOAD" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

APPOINTMENT_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))")"
if [ -z "$APPOINTMENT_ID" ]; then
  echo "ERRO: APPOINTMENT_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 6 | CRIAR ATTENDANCE ====="
ATTENDANCE_CREATE_PAYLOAD=$(cat <<EOF
{
  "appointmentId":"$APPOINTMENT_ID",
  "clientId":"$CLIENT_ID",
  "professionalId":"$PROFESSIONAL_ID",
  "serviceId":"$SERVICE_ID"
}
EOF
)

call_api "POST" "$API_URL/v1/attendances" "$ATTENDANCE_CREATE_PAYLOAD" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

ATTENDANCE_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))")"
if [ -z "$ATTENDANCE_ID" ]; then
  echo "ERRO: ATTENDANCE_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 7 | START DO ATTENDANCE ====="
call_api "POST" "$API_URL/v1/attendances/$ATTENDANCE_ID/start" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

echo
echo "===== CHECK 8 | FINISH DO ATTENDANCE ====="
call_api "POST" "$API_URL/v1/attendances/$ATTENDANCE_ID/finish" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

echo
echo "===== CHECK 9 | DEFINIR SOURCE_TYPE / SOURCE_ID DO FISCAL ====="
if grep -q "ATTENDANCE" prisma/schema.prisma; then
  FISCAL_SOURCE_TYPE="ATTENDANCE"
  SOURCE_ID="$ATTENDANCE_ID"
else
  FISCAL_SOURCE_TYPE="MANUAL"
  SOURCE_ID="att-$ATTENDANCE_ID"
fi

echo "FISCAL_SOURCE_TYPE=$FISCAL_SOURCE_TYPE"
echo "SOURCE_ID=$SOURCE_ID"

REFERENCE_NUMBER="RPS-$MARKER"
ACCESS_KEY="ACCESS-$MARKER"

echo
echo "===== CHECK 10 | CRIAR DOCUMENTO FISCAL ====="
FISCAL_CREATE_PAYLOAD=$(cat <<EOF
{
  "sourceType":"$FISCAL_SOURCE_TYPE",
  "sourceId":"$SOURCE_ID",
  "documentType":"NFSE",
  "provider":"SMOKE_TEST"
}
EOF
)

call_api "POST" "$API_URL/v1/fiscal-documents" "$FISCAL_CREATE_PAYLOAD" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

FISCAL_ID="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id',''))")"
if [ -z "$FISCAL_ID" ]; then
  echo "ERRO: FISCAL_ID veio vazio."
  exit 1
fi

echo
echo "===== CHECK 11 | DRAFT -> REQUESTED ====="
FISCAL_REQUESTED_PAYLOAD='{"status":"REQUESTED","message":"Solicitacao de emissao enviada ao provedor fiscal no fluxo-piloto."}'
call_api "POST" "$API_URL/v1/fiscal-documents/$FISCAL_ID/status" "$FISCAL_REQUESTED_PAYLOAD" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

echo
echo "===== CHECK 12 | REQUESTED -> AUTHORIZED ====="
FISCAL_AUTHORIZED_PAYLOAD=$(cat <<EOF
{
  "status":"AUTHORIZED",
  "message":"Documento fiscal autorizado no fluxo-piloto.",
  "referenceNumber":"$REFERENCE_NUMBER",
  "accessKey":"$ACCESS_KEY"
}
EOF
)

call_api "POST" "$API_URL/v1/fiscal-documents/$FISCAL_ID/status" "$FISCAL_AUTHORIZED_PAYLOAD" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200 201
print_json

echo
echo "===== CHECK 13 | DETAIL FINAL DO FISCAL ====="
call_api "GET" "$API_URL/v1/fiscal-documents/$FISCAL_ID" "" "$ACCESS_TOKEN"
assert_status_any "$HTTP_STATUS" 200
print_json

FINAL_STATUS="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status',''))")"
FINAL_REFERENCE_NUMBER="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('referenceNumber',''))")"
FINAL_ACCESS_KEY="$(printf '%s' "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessKey',''))")"

if [ "$FINAL_STATUS" != "AUTHORIZED" ]; then
  echo "ERRO: status final do fiscal nao ficou AUTHORIZED."
  exit 1
fi

if [ -z "$FINAL_REFERENCE_NUMBER" ] || [ -z "$FINAL_ACCESS_KEY" ]; then
  echo "ERRO: referenceNumber ou accessKey vieram vazios no detail final."
  exit 1
fi

echo
echo "===== RESUMO FINAL DO FLUXO-PILOTO ====="
echo "APPOINTMENT_ID=$APPOINTMENT_ID"
echo "ATTENDANCE_ID=$ATTENDANCE_ID"
echo "FISCAL_ID=$FISCAL_ID"
echo "SOURCE_ID=$SOURCE_ID"
echo "REFERENCE_NUMBER=$FINAL_REFERENCE_NUMBER"
echo "ACCESS_KEY=$FINAL_ACCESS_KEY"

echo
echo "===== FLUXO-PILOTO CONCLUIDO COM SUCESSO ====="
