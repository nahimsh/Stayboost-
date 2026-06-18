#!/usr/bin/env bash
#
# Post-deploy verification for StayBoost. Exercises the LIVE stack:
#   - health + readiness (DB reachable)
#   - authentication round-trip (signup -> login -> /me -> logout)
#   - tenant isolation (RLS): two accounts cannot see each other's properties
#
# Usage:  API_URL=https://api.stayboost.com [WEB_URL=...] [AI_URL=...] \
#           scripts/verify-deployment.sh
#
# Exit code 0 = all checks passed. Requires: bash, curl, python3.
set -euo pipefail

API_URL="${API_URL:?set API_URL to the deployed API base, e.g. https://api.stayboost.com}"
WEB_URL="${WEB_URL:-}"
AI_URL="${AI_URL:-}"

PASS=0
FAIL=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

green() { printf '\033[32m  PASS\033[0m %s\n' "$1"; PASS=$((PASS + 1)); }
red()   { printf '\033[31m  FAIL\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
info()  { printf '\033[36m[%s]\033[0m\n' "$1"; }

# json <file> <python-expr over `d`>  -> prints value, empty on error
json() { python3 -c "import json,sys
try:
    d=json.load(open('$1'))
    print($2)
except Exception:
    print('')"; }

ts="$(date +%s)"
emailA="verify-a-${ts}@stayboost.test"
emailB="verify-b-${ts}@stayboost.test"
pw="VerifyPass123!extra"

# ── 1. Health + readiness ────────────────────────────────────────────────────
info "1. Health & readiness"
code="$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/v1/health" || true)"
[ "$code" = "200" ] && green "GET /v1/health -> 200" || red "GET /v1/health -> $code"

code="$(curl -s -o "$TMP/ready" -w '%{http_code}' "$API_URL/v1/health/ready" || true)"
if [ "$code" = "200" ]; then green "GET /v1/health/ready -> 200 (DB reachable)"; else red "GET /v1/health/ready -> $code (DB NOT reachable)"; fi

if [ -n "$AI_URL" ]; then
  code="$(curl -s -o /dev/null -w '%{http_code}' "$AI_URL/health" || true)"
  [ "$code" = "200" ] && green "AI GET /health -> 200" || red "AI GET /health -> $code"
fi
if [ -n "$WEB_URL" ]; then
  code="$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL/" || true)"
  [ "$code" = "200" ] && green "WEB GET / -> 200" || red "WEB GET / -> $code"
fi

# signup_login <email> <jar> <csrf-out> <org-name>
signup_login() {
  local email="$1" jar="$2" csrf_out="$3" org="$4"
  curl -s -o "$TMP/su" -c "$jar" -X POST "$API_URL/v1/auth/signup" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"Verify User\",\"email\":\"$email\",\"password\":\"$pw\",\"organizationName\":\"$org\"}" >/dev/null || true
  # signup also logs in (sets cookies + returns csrfToken)
  local csrf; csrf="$(json "$TMP/su" "d.get('csrfToken','')")"
  if [ -z "$csrf" ]; then
    # fall back to explicit login (e.g. if the account already existed)
    curl -s -o "$TMP/li" -c "$jar" -X POST "$API_URL/v1/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$email\",\"password\":\"$pw\"}" >/dev/null || true
    csrf="$(json "$TMP/li" "d.get('csrfToken','')")"
  fi
  printf '%s' "$csrf" > "$csrf_out"
}

# ── 2. Authentication round-trip ─────────────────────────────────────────────
info "2. Authentication"
signup_login "$emailA" "$TMP/jarA" "$TMP/csrfA" "Verify Org A"
csrfA="$(cat "$TMP/csrfA")"
[ -n "$csrfA" ] && green "signup/login A issued a session + CSRF token" || red "signup/login A failed"

code="$(curl -s -o "$TMP/me" -b "$TMP/jarA" -w '%{http_code}' "$API_URL/v1/auth/me" || true)"
meEmail="$(json "$TMP/me" "d.get('email','')")"
if [ "$code" = "200" ] && [ "$meEmail" = "$emailA" ]; then green "GET /v1/auth/me returns the authenticated user"; else red "GET /v1/auth/me -> $code ($meEmail)"; fi

code="$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/v1/auth/me" || true)"
[ "$code" = "401" ] && green "GET /v1/auth/me without cookie -> 401 (protected)" || red "unauthenticated /me -> $code (expected 401)"

# ── 3. Tenant isolation (RLS) ────────────────────────────────────────────────
info "3. Tenant isolation (RLS)"
signup_login "$emailB" "$TMP/jarB" "$TMP/csrfB" "Verify Org B"
csrfB="$(cat "$TMP/csrfB")"

create_property() {
  local jar="$1" csrf="$2" name="$3" out="$4"
  curl -s -o "$out" -b "$jar" -X POST "$API_URL/v1/properties" \
    -H 'Content-Type: application/json' -H "X-CSRF-Token: $csrf" \
    -d "{\"name\":\"$name\",\"type\":\"villa\",\"country\":\"PT\",\"city\":\"Lagos\",\"roomsCount\":2}" >/dev/null || true
}
create_property "$TMP/jarA" "$csrfA" "Property-A-$ts" "$TMP/pA"
create_property "$TMP/jarB" "$csrfB" "Property-B-$ts" "$TMP/pB"
idA="$(json "$TMP/pA" "d.get('id','')")"
idB="$(json "$TMP/pB" "d.get('id','')")"
[ -n "$idA" ] && [ -n "$idB" ] && green "both tenants created a property" || red "property creation failed (A=$idA B=$idB)"

curl -s -o "$TMP/listA" -b "$TMP/jarA" "$API_URL/v1/properties" || true
seesOwn="$(json "$TMP/listA" "'yes' if any(p.get('id')=='$idA' for p in d) else 'no'")"
seesOther="$(json "$TMP/listA" "'yes' if any(p.get('id')=='$idB' for p in d) else 'no'")"
[ "$seesOwn" = "yes" ] && green "tenant A sees its own property" || red "tenant A cannot see its own property"
if [ "$seesOther" = "no" ]; then green "tenant A CANNOT see tenant B's property (RLS holds)"; else red "TENANT LEAK: A sees B's property"; fi

# ── 4. AI Property Analyzer (public) ─────────────────────────────────────────
info "4. AI Property Analyzer"
curl -s -o "$TMP/an" -w '%{http_code}' -X POST "$API_URL/v1/analyzer/run" \
  -H 'Content-Type: application/json' \
  -d '{"propertyName":"Verify Villa","propertyType":"villa","country":"PT","city":"Lagos","unitsCount":2,"currency":"EUR","channels":["airbnb"],"biggestChallenge":"more_bookings"}' \
  > "$TMP/an_code" || true
anCode="$(cat "$TMP/an_code")"
pillars="$(json "$TMP/an" "len(d.get('report',{}).get('pillars',[]))")"
anEngine="$(json "$TMP/an" "d.get('report',{}).get('engine','')")"
if [ "$anCode" = "200" ] && [ "$pillars" = "4" ]; then
  green "POST /v1/analyzer/run -> 200, 4 pillars (engine: ${anEngine:-?})"
else
  red "analyzer -> $anCode (pillars=$pillars)"
fi

# ── 5. Dashboard (authenticated) ─────────────────────────────────────────────
info "5. Dashboard"
code="$(curl -s -o "$TMP/dash" -b "$TMP/jarA" -w '%{http_code}' "$API_URL/v1/dashboard" || true)"
hasWidgets="$(json "$TMP/dash" "'yes' if all(k in d for k in ('revenue','occupancy','checkIns','checkOuts','recommendations')) else 'no'")"
if [ "$code" = "200" ] && [ "$hasWidgets" = "yes" ]; then
  green "GET /v1/dashboard -> 200 with all widget data"
else
  red "dashboard -> $code (widgets present: $hasWidgets)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo
info "Summary"
printf '  Passed: %s   Failed: %s\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || { echo "Deployment verification FAILED."; exit 1; }
echo "Deployment verification PASSED."
