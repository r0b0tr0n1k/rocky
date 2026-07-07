#!/bin/bash
set -euo pipefail

KILLED=0

kill_port() {
  local port="$1"
  local name="$2"
  local pids
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
  else
    pids=$(ss -tlnp | grep -E ":$port\b" | grep -oP 'pid=\K[0-9]+' || true)
  fi
  if [ -n "$pids" ]; then
    echo "$name on port $port: killing PIDs $(echo "$pids" | tr '\n' ' ')"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    KILLED=$((KILLED + 1))
  else
    echo "$name on port $port: no process found"
  fi
}

API_PORT="${API_PORT:-${PORT:-8080}}"
WEB_PORT="${WEB_PORT:-3001}"
DOCS_PORT="${DOCS_PORT:-3002}"

echo "Stopping rocky dev servers..."
kill_port "$API_PORT" "API"
kill_port "$WEB_PORT" "Web Admin"
kill_port "$DOCS_PORT" "Docs"

echo ""
if [ "$KILLED" -gt 0 ]; then
  echo "Dev servers stopped."
else
  echo "No running dev servers found."
fi
