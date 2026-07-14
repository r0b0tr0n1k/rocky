#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  scripts/setup-tunnel.sh — Cloudflare Tunnel bootstrap            ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# PURPOSE
#   One-shot setup that creates (or reuses) a Cloudflare Tunnel, wires it
#   to this app's services (api / web / docs) and Drizzle Studio, and writes
#   the tunnel credentials back
#   into .env so `docker compose up` can run the cloudflared sidecar.
#
# EXACTLY WHAT IT DOES, IN ORDER
#   1. Load .env  — only if CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID /
#      ROCKY_DOMAIN are not already exported in the shell.
#   2. Validate   — require CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
#      ROCKY_DOMAIN.  Optional: TUNNEL_NAME (default "rocky"),
#      CLOUDFLARE_ZONE_ID (looked up from ROCKY_DOMAIN if omitted).
#   3. Tunnel      — GET the account tunnel named $TUNNEL_NAME; if none
#      exists, POST-create it (config_src=cloudflare). Result = TUNNEL_ID.
#   4. Ingress     — PUT tunnel config, mapping 4 hostnames → services:
#        api.ROCKY_DOMAIN    → http://api:8080            (NestJS API)
#        admin.ROCKY_DOMAIN  → http://web:3000            (Next.js admin)
#        docs.ROCKY_DOMAIN   → http://docs:3002           (Nextra docs)
#        studio.ROCKY_DOMAIN → http://drizzle-studio:4983 (Drizzle Studio, --profile dev)
#        *                  → http_status:404
#   5. DNS         — resolve the Cloudflare ZONE ID for ROCKY_DOMAIN, then
#      POST proxied CNAME records api/admin/docs → <TUNNEL_ID>.cfargotunnel.com
#      (already-exists errors are ignored).
#   6. Token       — GET the tunnel token and write TUNNEL_TOKEN + TUNNEL_ID
#      back into .env (idempotent: replaces existing lines).
#
# REQUIREMENTS
#   curl + jq. A Cloudflare account that owns ROCKY_DOMAIN with a Zone for
#   it, and an API token granted:
#     • Account › Cloudflare Tunnel:Edit
#     • Zone    › DNS:Edit
#
# USAGE
#   bash scripts/setup-tunnel.sh              # reads vars from .env
#   CLOUDFLARE_API_TOKEN=xxx bash scripts/setup-tunnel.sh   # or export first
#
# AFTER
#   docker compose up -d            # cloudflared reads TUNNEL_TOKEN from .env
#   Public: https://api.ROCKY_DOMAIN  https://admin.ROCKY_DOMAIN  https://docs.ROCKY_DOMAIN

set -euo pipefail

command -v curl >/dev/null 2>&1 || {
	echo "ERROR: curl is required" >&2
	exit 1
}
command -v jq >/dev/null 2>&1 || {
	echo "ERROR: jq is required" >&2
	exit 1
}

# ── 1. Load .env if needed ─────────────────────────────────────
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${CLOUDFLARE_ACCOUNT_ID:-}" || -z "${ROCKY_DOMAIN:-}" ]]; then
	if [[ -f .env ]]; then
		echo "⟳ Loading .env ..."
		set -a
		source .env
		set +a
	else
		echo "ERROR: .env not found and required vars are not exported." >&2
		exit 1
	fi
fi

# ── 2. Validate required vars ──────────────────────────────────
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required (Cloudflare API token: Account>Tunnel:Edit + Zone>DNS:Edit)}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required (Cloudflare Dashboard › Overview)}"
: "${ROCKY_DOMAIN:?ROCKY_DOMAIN is required (e.g. rocky.tehno.party)}"

TUNNEL_NAME="${TUNNEL_NAME:-rocky}"
CF_API="https://api.cloudflare.com/client/v4"
AUTH="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"

# ── 3. Resolve or create the tunnel ────────────────────────────
echo "⟳ Looking up tunnel '${TUNNEL_NAME}' in account ${CLOUDFLARE_ACCOUNT_ID} ..."
TUNNEL_ID=$(curl -s --fail -H "$AUTH" \
	"${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel?name=${TUNNEL_NAME}" |
	jq -r '.result[0].id // empty') || TUNNEL_ID=""

if [[ -n "$TUNNEL_ID" ]]; then
	echo "✓ Reusing existing tunnel: ${TUNNEL_ID}"
else
	echo "⟳ Creating tunnel '${TUNNEL_NAME}' ..."
	TUNNEL_ID=$(curl -s --fail -X POST -H "$AUTH" -H "Content-Type: application/json" \
		--data "{\"name\":\"${TUNNEL_NAME}\",\"config_src\":\"cloudflare\"}" \
		"${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel" |
		jq -r '.result.id')
	echo "✓ Created tunnel: ${TUNNEL_ID}"
fi

# ── 4. Push ingress rules ──────────────────────────────────────
echo "⟳ Pushing ingress rules ..."
curl -s --fail -X PUT -H "$AUTH" -H "Content-Type: application/json" \
	--data "{
    \"config\": {
      \"ingress\": [
        { \"hostname\": \"api.${ROCKY_DOMAIN}\",   \"service\": \"http://api:8080\",  \"originRequest\": {} },
        { \"hostname\": \"admin.${ROCKY_DOMAIN}\", \"service\": \"http://web:3000\",  \"originRequest\": {} },
        { \"hostname\": \"docs.${ROCKY_DOMAIN}\",  \"service\": \"http://docs:3002\", \"originRequest\": {} },
        { \"hostname\": \"studio.${ROCKY_DOMAIN}\", \"service\": \"http://drizzle-studio:4983\", \"originRequest\": {} },
        { \"service\": \"http_status:404\" }
      ]
    }
  }" \
	"${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations"
echo "✓ Ingress rules pushed."

# ── 5. Resolve zone id, then create DNS CNAMEs ─────────────────
# ROCKY_DOMAIN may be a subdomain (rocky.tehno.party); the Zone is the
# registrable domain (tehno.party). Look the zone id up from the API.
ZONE_NAME=$(echo "$ROCKY_DOMAIN" | awk -F. '{ if (NF>=3) print $(NF-1)"."$NF; else print $0 }')
if [[ -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
	echo "⟳ Resolving zone id for '${ZONE_NAME}' ..."
	CLOUDFLARE_ZONE_ID=$(curl -s --fail -H "$AUTH" \
		"${CF_API}/zones?name=${ZONE_NAME}&account.id=${CLOUDFLARE_ACCOUNT_ID}" |
		jq -r '.result[0].id // empty') || CLOUDFLARE_ZONE_ID=""
	[[ -n "$CLOUDFLARE_ZONE_ID" ]] || {
		echo "ERROR: could not resolve ZONE_ID for ${ZONE_NAME}" >&2
		exit 1
	}
fi
echo "✓ Zone id: ${CLOUDFLARE_ZONE_ID}"

for sub in api admin docs studio; do
	echo "⟳ Creating CNAME ${sub}.${ROCKY_DOMAIN} → ${TUNNEL_ID}.cfargotunnel.com ..."
	curl -s --fail -X POST -H "$AUTH" -H "Content-Type: application/json" \
		--data "{
      \"type\": \"CNAME\",
      \"proxied\": true,
      \"name\": \"${sub}\",
      \"content\": \"${TUNNEL_ID}.cfargotunnel.com\"
    }" \
		"${CF_API}/zones/${CLOUDFLARE_ZONE_ID}/dns_records" &&
		echo "  ✓ ${sub}.${ROCKY_DOMAIN}" ||
		echo "  (record may already exist — continuing)"
done

# ── 6. Fetch token and write credentials into .env ─────────────
echo "⟳ Fetching tunnel token ..."
TOKEN=$(curl -s --fail -H "$AUTH" \
	"${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}" |
	jq -r '.result.token')
[[ -n "$TOKEN" && "$TOKEN" != "null" ]] || {
	echo "ERROR: failed to fetch tunnel token" >&2
	exit 1
}
echo "✓ Got token: ${TOKEN:0:12}..."

if [[ -f .env ]]; then
	for kv in "TUNNEL_ID=${TUNNEL_ID}" "TUNNEL_TOKEN=${TOKEN}"; do
		key="${kv%%=*}"
		if grep -q "^${key}=" .env; then
			sed -i.bak "s|^${key}=.*|${kv}|" .env && rm -f .env.bak
		else
			printf '%s\n' "${kv}" >>.env
		fi
	done
	echo "✓ .env updated (TUNNEL_ID, TUNNEL_TOKEN)."
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Tunnel ready"
echo "  Tunnel : ${TUNNEL_NAME}  (${TUNNEL_ID})"
echo "  Domain : ${ROCKY_DOMAIN}   zone: ${CLOUDFLARE_ZONE_ID}"
echo "  Routes : https://api.${ROCKY_DOMAIN}"
echo "           https://admin.${ROCKY_DOMAIN}"
echo "           https://docs.${ROCKY_DOMAIN}"
echo "           https://studio.${ROCKY_DOMAIN}  (--profile dev)"
echo ""
echo "  Next:  docker compose up -d"
echo "═══════════════════════════════════════════════════════════"
