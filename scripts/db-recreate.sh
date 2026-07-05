#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  scripts/db-recreate.sh — Database Clean Recreate
# ──────────────────────────────────────────────────────────────────────────────
# Drops the database, destroys old migrations, generates a fresh single
# migration from the current code, fixes RLS policy SQL (drizzle-kit v1.0.0-rc.4
# bug with $N placeholders), applies it, and seeds test data.
#
# Usage:
#   ./scripts/db-recreate.sh             # full cycle
#   ./scripts/db-recreate.sh --no-seed   # skip seed for faster iteration
#   ./scripts/db-recreate.sh --seed-only # re-seed existing DB, skip schema
#   ./scripts/db-recreate.sh --dry-run   # print what would be done
#   ./scripts/db-recreate.sh --help      # this message
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PKG="$SCRIPT_DIR/packages/database"

# ── Parse flags ──────────────────────────────────────────────────────────────
SEED=true
SCHEMA=true
DRY_RUN=false

for arg in "$@"; do
	case "$arg" in
	--no-seed) SEED=false ;;
	--seed-only) SCHEMA=false ;;
	--dry-run) DRY_RUN=true ;;
	--help)
		sed -n '3,15p' "$0" | sed 's/^# //; s/^#$//'
		exit 0
		;;
	esac
done

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info() { echo -e "${CYAN}▸${NC} ${BOLD}$1${NC}"; }
ok() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() {
	echo -e "  ${RED}✗${NC} $1"
	exit 1
}
run() {
	if [ "$DRY_RUN" = true ]; then
		echo -e "  ${YELLOW}[dry-run]${NC} $*"
		return 0
	fi
	"$@"
}

# ── Load DATABASE_URL ────────────────────────────────────────────────────────
load_db_url() {
	local env_file="$DB_PKG/.env"
	# shellcheck disable=SC1090
	[ -f "$env_file" ] && set -a && source "$env_file" && set +a
	[ -z "${DATABASE_URL:-}" ] && fail "DATABASE_URL not set. Create $DB_PKG/.env from template."

	# Parse: postgresql://user:pass@host:port/db
	DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+).*|\1|')
	DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+).*|\1|')
	DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+).*|\1|')
	DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
	DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')
	export PGPASSWORD="$DB_PASS"
}

# ── Step 1: Drop & Recreate Database ─────────────────────────────────────────
drop_and_create_db() {
	info "Step 1: Drop & recreate database «${DB_NAME}»"
	run psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
		-c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" 2>&1 | tail -1
	run psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
		-c "CREATE DATABASE \"${DB_NAME}\";" 2>&1 | tail -1
	ok "Database «${DB_NAME}» recreated"
}

# ── Step 2: Destroy old migration artifacts ──────────────────────────────────
destroy_migrations() {
	info "Step 2: Remove old drizzle migration folders"
	run rm -rf "$DB_PKG/drizzle/"
	ok "drizzle/ directory destroyed"
}

# ── Step 3: Generate fresh schema ────────────────────────────────────────────
generate_schema() {
	info "Step 3: Generate fresh migration from current code"
	cd "$DB_PKG"
	run pnpm generate 2>&1
	cd "$SCRIPT_DIR"

	local dirs=("$DB_PKG"/drizzle/*/)
	[ ${#dirs[@]} -eq 0 ] && fail "drizzle-kit generate produced no output"
	[ ! -f "${dirs[0]}migration.sql" ] && fail "No migration.sql generated"
	ok "Migration generated: $(basename "${dirs[0]}")"
}

# ── Step 4: Fix RLS SQL ──────────────────────────────────────────────────────
fix_rls() {
	info "Step 4: Fix RLS policy SQL (drizzle-kit \$N placeholder bug)"

	run cd "$DB_PKG"
	run node "$SCRIPT_DIR/scripts/fix-rls-sql.mjs" 2>&1

	# Post-fix standalone $N — the fix script handles ANY(($1,$2)) patterns
	# but misses standalone = $3 in some policies (e.g. users table RLS).
	local fixed_sql
	fixed_sql=$(find "$DB_PKG"/drizzle -maxdepth 2 -name migration.fixed.sql -print 2>/dev/null | tail -1)
	if [ -z "$fixed_sql" ]; then
		warn "No migration.fixed.sql found — skipping standalone \$N fix"
		cd "$SCRIPT_DIR"
		return
	fi

	if [ "$DRY_RUN" = false ]; then
		# Replace standalone = $3 through = $9 with proper role literals
		node -e "
const fs = require('fs');
const map = {3:'VD_STAFF',4:'VETERINARIAN',5:'TECHNICIAN',
             6:'FARMER',7:'SLAUGHTERHOUSE_OP',8:'MARKET_OP',9:'SUPPLIER'};
let sql = fs.readFileSync('$fixed_sql', 'utf8');
let count = 0;
sql = sql.replace(/= \\\$(\d)\b/g, (m, n) => {
  if (map[n]) { count++; return \"= '\" + map[n] + \"'\"; }
  return m;
});
if (count > 0) console.log('  Fixed ' + count + ' standalone \\\" + \"N reference(s) in ' + process.argv[1].split('/').pop());
fs.writeFileSync('$fixed_sql', sql);
" "$fixed_sql"
	fi

	cd "$SCRIPT_DIR"
	ok "RLS SQL fixed"
}

# ── Step 5: Apply migration ──────────────────────────────────────────────────
apply_migration() {
	info "Step 5: Apply migration to «${DB_NAME}»"
	local fixed_sql
	fixed_sql=$(find "$DB_PKG"/drizzle -maxdepth 2 -name migration.fixed.sql -print 2>/dev/null | tail -1)
	[ -z "$fixed_sql" ] && fail "No migration.fixed.sql found in $DB_PKG/drizzle/*/"
	run psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
		-f "$fixed_sql" 2>&1 | tail -3
	ok "Migration applied: $(basename "$(dirname "$fixed_sql")")"
}

# ── Step 6: Seed ─────────────────────────────────────────────────────────────
seed_data() {
	info "Step 6: Seed database"
	cd "$DB_PKG"
	run pnpm seed 2>&1
	cd "$SCRIPT_DIR"
	ok "Seed complete"
}

# ── Summary ──────────────────────────────────────────────────────────────────
summary() {
	local tbl_count
	tbl_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" \
		-U "$DB_USER" -d "$DB_NAME" -tAc \
		"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "?")

	echo ""
	echo "  ┌────────────────────────────────────────────────────────┐"
	echo "  │  ${GREEN}DB RECREATE COMPLETE${NC}                              │"
	echo "  └────────────────────────────────────────────────────────┘"
	echo ""
	echo "  Database: ${CYAN}${DB_NAME}${NC} @ ${BOLD}${DB_HOST}:${DB_PORT}${NC}"
	echo "  User:     ${BOLD}${DB_USER}${NC}"
	echo "  Tables:   ${BOLD}${tbl_count}${NC}"
	echo ""
	echo "  ${YELLOW}Next:${NC} cd apps/api && nest build && nest start"
}

# ══════════════════════════════════════════════════════════════════════════════
#  Main
# ══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "  ${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "  ${CYAN}║  ${BOLD}Rocky Database — Clean Recreate${NC}                 ${CYAN}║${NC}"
echo -e "  ${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

load_db_url

if [ "$SCHEMA" = true ]; then
	drop_and_create_db
	destroy_migrations
	generate_schema
	fix_rls
	apply_migration
else
	ok "Skipping schema (--seed-only)"
fi

if [ "$SEED" = true ]; then
	seed_data
else
	ok "Skipping seed (--no-seed)"
fi

summary
