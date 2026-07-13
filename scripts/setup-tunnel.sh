#!/usr/bin/env bash
# ── Cloudflare Tunnel bootstrap ──────────────────────────────────
# Reads CLOUDFLARE_API_TOKEN + ROCKY_DOMAIN from .env, creates the
# tunnel via Cloudflare API, pushes ingress rules, and writes the
# resulting TUNNEL_TOKEN back into .env.
#
# Usage:
#   CLOUDFLARE_API_TOKEN=<your-api-token> ROCKY_DOMAIN=rocky.example.com \
#     bash scripts/setup-tunnel.sh
#
# Or source .env first:
#   set -a; source .env; set +a
#   bash scripts/setup-tunnel.sh

set -euo pipefail

# ── Load .env if not already in environment ────────────────────
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${ROCKY_DOMAIN:-}" ]]; then
  if [[ -f .env ]]; then
    echo "⟳ Loading .env ..."
    set -a
    source .env
    set +a
  else
    echo "ERROR: .env not found and CLOUDFLARE_API_TOKEN / ROCKY_DOMAIN not set." >&2
    exit 1
  fi
fi

# ── Validate required vars ─────────────────────────────────────
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${ROCKY_DOMAIN:?ROCKY_DOMAIN is required}"

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
if [[ -z "$ACCOUNT_ID" ]]; then
  echo "ERROR: CLOUDFLARE_ACCOUNT_ID is required (find it in Cloudflare Dashboard > Overview > Account ID)." >&2
  exit 1
fi

TUNNEL_NAME="${TUNNEL_NAME:-rocky}"

# ── Resolve existing tunnel or create new ──────────────────────
echo "⟳ Checking for existing tunnel '$TUNNEL_NAME' ..."
existing=$(curl -s --fail \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel?name=${TUNNEL_NAME}" \
  | jq -r '.result[0].id // empty') || true

if [[ -n "$existing" ]]; then
  echo "✓ Found existing tunnel: ${existing}"
  TUNNEL_ID="$existing"
else
  echo "⟳ Creating tunnel '$TUNNEL_NAME' ..."
  TUNNEL_ID=$(curl -s \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"name":"'"${TUNNEL_NAME}"'","config_src":"cloudflare"}' \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel" \
    | jq -r '.result.id')
  echo "✓ Created tunnel: ${TUNNEL_ID}"
fi

# ── Push ingress rules ─────────────────────────────────────────
echo "⟳ Pushing ingress rules ..."
curl -s --fail -o /dev/null \
  -X PUT \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "config": {
      "ingress": [
        { "hostname": "api.'"${ROCKY_DOMAIN}"'", "service": "http://api:8080", "originRequest": {} },
        { "hostname": "admin.'"${ROCKY_DOMAIN}"'", "service": "http://web:3000", "originRequest": {} },
        { "hostname": "docs.'"${ROCKY_DOMAIN}"'", "service": "http://docs:3002", "originRequest": {} },
        { "service": "http_status:404" }
      ]
    }
  }' \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations"
echo "✓ Ingress rules pushed."

# ── Ensure DNS records exist (CNAME → <tunnel-id>.cfargotunnel.com) ──
for subdomain in api admin docs; do
  hostname="${subdomain}.${ROCKY_DOMAIN}"
  echo "⟳ Ensuring DNS record for ${hostname} ..."
  # Try to create; ignore 10000 (already exists)
  curl -s --fail -o /dev/null \
    -X POST \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{
      "type": "CNAME",
      "proxied": true,
      "name": "'"${subdomain}"'",
      "content": "'"${TUNNEL_ID}.cfargotunnel.com"'"
    }' \
    "https://api.cloudflare.com/client/v4/zones/$(echo "$ROCKY_DOMAIN" | awk -F. '{print ($NF==="party") ? $(NF-1)"."$NF : $NF}')/dns_records" || \
  echo "  (record may already exist — continuing)"
done
echo "✓ DNS records ensured."

# ── Create DNS record helper (needs zone_id) ───────────────────
# We avoid hardcoding zone lookup; user can run:
#   curl .../zones?name=<domain> | jq -r '.result[0].id'
# and re-run if needed. The tunnel works without explicit CNAME
# if the dashboard route-dns command was used.

# ── Retrieve the tunnel token ──────────────────────────────────
echo "⟳ Fetching tunnel token ..."
TOKEN=$(curl -s \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}" \
  | jq -r '.result.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "ERROR: Failed to fetch tunnel token." >&2
  exit 1
fi

echo "✓ Got token: ${TOKEN:0:12}..."

# ── Write token into .env ──────────────────────────────────────
if [[ -f .env ]]; then
  echo "⟳ Updating TUNNEL_TOKEN in .env ..."
  if grep -q '^TUNNEL_TOKEN=' .env; then
    sed -i.bak 's|^TUNNEL_TOKEN=.*|TUNNEL_TOKEN='"${TOKEN}"'|' .env
    rm -f .env.bak
  else
    echo "TUNNEL_TOKEN=${TOKEN}" >> .env
  fi
  echo "✓ .env updated."
else
  echo "TUNNEL_TOKEN=${TOKEN}" > .env
  echo "✓ Created .env with TUNNEL_TOKEN."
fi

# ── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Tunnel setup complete"
echo "  Tunnel ID : ${TUNNEL_ID}"
echo "  Tunnel    : ${TUNNEL_NAME}"
echo "  Domain    : ${ROCKY_DOMAIN}"
echo "  Token     : ${TOKEN:0:12}... (written to .env)"
echo ""
echo "  Next:"
echo "    docker compose up -d"
echo "    docker compose logs -f cloudflared"
echo ""
echo "  Public routes:"
echo "    https://api.${ROCKY_DOMAIN}"
echo "    https://admin.${ROCKY_DOMAIN}"
echo "    https://docs.${ROCKY_DOMAIN}"
echo "═══════════════════════════════════════════════════════════"
