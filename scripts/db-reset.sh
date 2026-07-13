#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  scripts/db-reset.sh — Database Reset Button
# ──────────────────────────────────────────────────────────────────────────────
# Dumps the current database (safety backup), then wipes the drizzle migrations
# and regenerates the schema from current code, seeds master data (diseases,
# vaccines, permissions, AHL EU reference), and optionally loads factory-based
# demo data via packages/testing (populate-demo). It is the "reset button": a
# clean, reproducible slate for demos and testing.
#
# This is NOT a migration of live data — it starts from code + seed + (opt) demo.
# Reuses scripts/db-recreate.sh for the wipe/generate/seed core.
#
# Usage:
#   ./scripts/db-reset.sh                 # dump + recreate + demo (prompts)
#   ./scripts/db-reset.sh --no-demo       # skip factory demo data
#   ./scripts/db-reset.sh --no-dump       # skip the backup dump
#   ./scripts/db-reset.sh --yes           # skip the confirm prompt
#   ./scripts/db-reset.sh --dry-run       # show what would happen
#   ./scripts/db-reset.sh --help          # this message
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PKG="$SCRIPT_DIR/packages/database"

# ── Flags ────────────────────────────────────────────────────────────────────
DO_DUMP=true
DO_DEMO=true
ASSUME_YES=false
DRY_RUN=false

for arg in "$@"; do
	case "$arg" in
	--no-dump) DO_DUMP=false ;;
	--no-demo) DO_DEMO=false ;;
	--yes | -y) ASSUME_YES=true ;;
	--dry-run) DRY_RUN=true ;;
	--help | -h)
		sed -n '3,18p' "$0" | sed 's/^# //; s/^#$//'
		exit 0
		;;
	*)
		echo "Unknown arg: $arg" >&2
		exit 1
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

# ── Load DATABASE_URL (from packages/database/.env) ──────────────────────────
load_db_url() {
	local env_file="$DB_PKG/.env"
	[ -f "$env_file" ] && set -a && source "$env_file" && set +a
	[ -z "${DATABASE_URL:-}" ] && fail "DATABASE_URL not set. Create $DB_PKG/.env from template."
	DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+).*|\1|')
	DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+).*|\1|')
	DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+).*|\1|')
	DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
	DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')
	export PGPASSWORD="$DB_PASS"
}

# ── Main ─────────────────────────────────────────────────────────────────────
echo -e "  ${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "  ${CYAN}║  ${BOLD}Rocky Database — Reset Button${NC}                   ${CYAN}║${NC}"
echo -e "  ${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

load_db_url
BACKUP_DIR="$SCRIPT_DIR/backups"
BACKUP="$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).dump"

# ── Step 0: backup (abort-safe — never wipe if the dump fails) ───────────────
if [ "$DO_DUMP" = true ]; then
	mkdir -p "$BACKUP_DIR"
	info "Step 0: Backup current database «${DB_NAME}» → $BACKUP"
	if [ "$DRY_RUN" = true ]; then
		echo "  [dry-run] pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP"
	else
		pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP" ||
			fail "pg_dump failed — aborting BEFORE any wipe. Fix the connection and retry."
		ok "Backup written: $BACKUP"
	fi
else
	warn "Skipping backup (--no-dump). Current data will be UNRECOVERABLE."
fi

# ── Confirm (skip in --dry-run / --yes) ──────────────────────────────────────
if [ "$ASSUME_YES" = false ] && [ "$DRY_RUN" = false ]; then
	echo -e "  ${YELLOW}⚠ This DROPs database «${DB_NAME}» @ ${DB_HOST}:${DB_PORT} and regenerates it from scratch.${NC}"
	[ "$DO_DUMP" = true ] && echo "    A backup is at: $BACKUP"
	read -r -p "  Continue? [y/N] " ans
	case "$ans" in y | Y | yes | YES) ;; *)
		echo "  Aborted."
		exit 0
		;;
	esac
fi

# ── Step 1: wipe migrations + regenerate + seed (diseases, vaccines, AHL) ─────
info "Step 1: Recreate schema + seed (diseases, vaccines, permissions, AHL EU reference)"
run bash "$SCRIPT_DIR/scripts/db-recreate.sh" $([ "$DRY_RUN" = true ] && echo --dry-run)

# ── Step 2: factory-based demo data ──────────────────────────────────────────
if [ "$DO_DEMO" = true ]; then
	info "Step 2: Load factory-based demo data (packages/testing populate)"
	if [ "$DRY_RUN" = false ]; then
		run pnpm -C packages/testing populate 2>&1
	else
		echo "  [dry-run] pnpm -C packages/testing populate"
	fi
else
	warn "Skipping factory demo data (--no-demo)."
fi

# ── Step 3: verify ───────────────────────────────────────────────────────────
info "Step 3: Verify landed data"
if [ "$DRY_RUN" = false ]; then
	PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 'diseases(total)'        , count(*) FROM diseases
    UNION ALL SELECT 'diseases(cat)', count(*) FROM diseases WHERE disease_category IS NOT NULL
    UNION ALL SELECT 'vaccines'         , count(*) FROM vaccines
    UNION ALL SELECT 'farms'            , count(*) FROM farms
    UNION ALL SELECT 'animals'          , count(*) FROM animals;" 2>/dev/null |
		sed 's/^/    /' ||
		warn "Could not read counts (DB may be mid-startup)."
fi

echo ""
echo -e "  ${GREEN}✓ Reset complete.${NC}"
[ "$DO_DUMP" = true ] && echo -e "    Backup: ${BOLD}$BACKUP${NC}"
echo -e "    Restore: ${BOLD}pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d <newdb> $BACKUP${NC}"
