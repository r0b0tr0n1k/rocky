#!/bin/bash

# Script to migrate Zod from v3 to v4 in apps and packages containing Zod usage
#
# Usage:
#   ./zod-migrate-v3-to-v4.sh              # Run on all apps/packages (default)
#   ./zod-migrate-v3-to-v4.sh <folder>     # Run on specific folder only
#   ./zod-migrate-v3-to-v4.sh apps/api     # Example: single app
#   ./zod-migrate-v3-to-v4.sh packages/foo # Example: single package

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Resolve target directories ---
if [ $# -ge 1 ]; then
	TARGET="$1"

	# Support both absolute paths and relative (from repo root)
	if [ -d "$TARGET" ]; then
		INPUT_DIR="$TARGET"
	elif [ -d "$ROOT_DIR/$TARGET" ]; then
		INPUT_DIR="$ROOT_DIR/$TARGET"
	else
		echo "ERROR: Folder '$TARGET' not found (tried '$TARGET' and '$ROOT_DIR/$TARGET')"
		exit 1
	fi

	# If the target itself has tsconfig.json, run directly in it
	if [ -f "$INPUT_DIR/tsconfig.json" ]; then
		ZOD_DIRS="$INPUT_DIR"
	else
		# Otherwise, find subdirectories with tsconfig.json
		ZOD_DIRS=$(find "$INPUT_DIR" -name tsconfig.json -exec dirname {} \; | sort | uniq)
	fi
else
	# Default: scan all apps and packages
	ZOD_DIRS=$(find apps packages -name tsconfig.json -exec dirname {} \; | sort | uniq)
fi

if [ -z "$ZOD_DIRS" ]; then
	echo "No directories with tsconfig.json found."
	exit 0
fi

echo "Starting Zod v3 to v4 migration..."
echo "Found directories with tsconfig.json:"
echo "$ZOD_DIRS"
echo ""

PROCESSED=()
ERRORS=()

for dir in $ZOD_DIRS; do
	if ! find "$dir" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "zod" {} \; | head -n1 | grep -q .; then
		echo "Skipping $dir (no Zod usage)"
		continue
	fi

	echo "Processing $dir..."
	if cd "$dir" && sleep 1 && bunx zod-v3-to-v4 tsconfig.json; then
		echo "Successfully migrated $dir"
		PROCESSED+=("$dir")
	else
		echo "Error migrating $dir"
		ERRORS+=("$dir")
	fi

	# Return to root
	cd "$ROOT_DIR"
	sleep 1
done

echo ""
echo "Migration completed."
echo "Processed directories: ${#PROCESSED[@]}"
echo "Directories with errors: ${#ERRORS[@]}"

if [ ${#ERRORS[@]} -gt 0 ]; then
	echo "Directories that failed:"
	printf '%s\n' "${ERRORS[@]}"
	exit 1
fi

echo "All migrations successful."
