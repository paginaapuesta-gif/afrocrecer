#!/usr/bin/env bash
set -euo pipefail

# Quick smoke test for CMS APIs.
# Usage:
#   ./scripts/cms-smoke.sh \
#     --api http://localhost:3000 \
#     --token "<JWT_ADMIN_OPTIONAL>" \
#     --file frontend/images/1.jpg \
#     --key home.imagen.1

API_BASE="http://localhost:3000"
TOKEN=""
FILE_PATH="frontend/images/1.jpg"
KEY="home.texto.1"
VALUE="Smoke test CMS $(date +%s)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api) API_BASE="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    --file) FILE_PATH="$2"; shift 2 ;;
    --key) KEY="$2"; shift 2 ;;
    --value) VALUE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

AUTH_HEADER=()
if [[ -n "$TOKEN" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")
fi

echo "== 1) Health check =="
curl -fsS "$API_BASE/" >/dev/null
echo "OK backend reachable: $API_BASE"

echo "== 2) Upload image =="
UPLOAD_JSON=$(curl -sS -X POST "$API_BASE/api/upload" \
  "${AUTH_HEADER[@]}" \
  -F "file=@$FILE_PATH")
echo "$UPLOAD_JSON"

UPLOAD_URL=$(printf '%s' "$UPLOAD_JSON" | sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [[ -z "$UPLOAD_URL" ]]; then
  echo "ERROR: upload response without url"
  exit 1
fi

echo "== 3) Save CMS content =="
SAVE_JSON=$(curl -sS -X PUT "$API_BASE/api/content/$KEY" \
  "${AUTH_HEADER[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"valor\":\"$VALUE\"}")
echo "$SAVE_JSON"

echo "== 4) Read CMS content =="
READ_JSON=$(curl -sS "$API_BASE/api/content/$KEY")
echo "$READ_JSON"

echo "Smoke test complete."
