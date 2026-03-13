#!/usr/bin/env bash
# One-click script to wipe DynamoDB and re-seed with mock data.
# Requires: AcasService running in Development (e.g. http://localhost:8002).

set -e

BASE_URL="${ACAS_BASE_URL:-http://localhost:8002}"
ENDPOINT="${BASE_URL}/api/dev/reset-db"

echo "Resetting database via ${ENDPOINT} ..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" -H "Content-Type: application/json")

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Success: $HTTP_BODY" | head -c 500
  echo ""
  exit 0
fi

echo "Request failed (HTTP $HTTP_CODE): $HTTP_BODY" >&2
exit 1
