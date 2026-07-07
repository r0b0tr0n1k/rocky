#!/bin/bash
# Detect and optionally clean compiled TypeScript files in src directories
# Indicates incorrect tsc usage — compiled files should be in dist/, not src/

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo "=========================================="
echo "Detecting compiled files in src/ directories"
echo "=========================================="
echo ""

FOUND=0
TOTAL_FILES=0
DELETE_LIST=""

# Check all packages
for package in packages/*/ packages/domains/*/; do
        if [ -d "$package" ]; then
                # Find compiled files in src
                FILES=$(find "$package/src" -type f \( -name "*.js" -o -name "*.js.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \) 2>/dev/null || true)

                # Count non-empty lines only
                COUNT=0
                if [ -n "$FILES" ]; then
                        while IFS= read -r line; do
                                [ -n "$line" ] && COUNT=$((COUNT + 1))
                        done <<<"$FILES"
                fi

                if [ "$COUNT" -gt 0 ]; then
                        echo -e "${RED}❌ $package: Found $COUNT compiled files in src/${NC}"
                        FOUND=$((FOUND + 1))
                        TOTAL_FILES=$((TOTAL_FILES + COUNT))
                        DELETE_LIST="$DELETE_LIST$FILES"$'\n'
                fi
        fi
done

# Check panopticon directory
if [ -d "panopticon/src" ]; then
        FILES=$(find "panopticon/src" -type f \( -name "*.js" -o -name "*.js.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \) 2>/dev/null || true)

        COUNT=0
        if [ -n "$FILES" ]; then
                while IFS= read -r line; do
                        [ -n "$line" ] && COUNT=$((COUNT + 1))
                done <<<"$FILES"
        fi

        if [ "$COUNT" -gt 0 ]; then
                echo -e "${RED}❌ panopticon/: Found $COUNT compiled files in src/${NC}"
                FOUND=$((FOUND + 1))
                TOTAL_FILES=$((TOTAL_FILES + COUNT))
                DELETE_LIST="$DELETE_LIST$FILES"$'\n'
        fi
fi

# Check apps
for app in apps/*/; do
        if [ -d "$app" ]; then
                FILES=$(find "$app/src" -type f \( -name "*.js" -o -name "*.js.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \) 2>/dev/null || true)

                COUNT=0
                if [ -n "$FILES" ]; then
                        while IFS= read -r line; do
                                [ -n "$line" ] && COUNT=$((COUNT + 1))
                        done <<<"$FILES"
                fi

                if [ "$COUNT" -gt 0 ]; then
                        echo -e "${RED}❌ $app: Found $COUNT compiled files in src/${NC}"
                        FOUND=$((FOUND + 1))
                        TOTAL_FILES=$((TOTAL_FILES + COUNT))
                        DELETE_LIST="$DELETE_LIST$FILES"$'\n'
                fi
        fi
done

echo ""
if [ "$FOUND" -eq 0 ]; then
        echo -e "${GREEN}✅ No compiled files found in src directories!${NC}"
        echo ""
        echo "The Diamond Seal is pure."
else
        echo -e "${YELLOW}⚠️  Found $TOTAL_FILES compiled files across $FOUND packages/apps${NC}"
        echo ""

        # Show file type breakdown
        D_TS_COUNT=$(echo "$DELETE_LIST" | grep -c '\.d\.ts$' 2>/dev/null || echo 0)
        D_TS_MAP_COUNT=$(echo "$DELETE_LIST" | grep -c '\.d\.ts\.map$' 2>/dev/null || echo 0)
        JS_COUNT=$(echo "$DELETE_LIST" | grep -c '\.js$' 2>/dev/null || echo 0)
        JS_MAP_COUNT=$(echo "$DELETE_LIST" | grep -c '\.js\.map$' 2>/dev/null || echo 0)

        echo "Breakdown:"
        echo "  .d.ts files:      $D_TS_COUNT"
        echo "  .d.ts.map files:  $D_TS_MAP_COUNT"
        echo "  .js files:        $JS_COUNT"
        echo "  .js.map files:    $JS_MAP_COUNT"
        echo ""

        # Offer clean command
        echo -e "${BLUE}To clean ALL compiled files in src/ directories, run:${NC}"
        echo ""
        echo -e "  ${GREEN}bun run clean:src-compiled${NC}"
        echo ""
        echo "Or manually:"
        echo "  find packages/*/src packages/domains/*/src apps/*/src panopticon/src \\"
        echo "    -type f \\( -name '*.js' -o -name '*.js.map' -o -name '*.d.ts' -o -name '*.d.ts.map' \\)"
        echo "    -delete"
        echo ""

        # If --clean flag is passed, delete immediately
        if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
                echo -e "${YELLOW}Cleaning $TOTAL_FILES files...${NC}"
                echo ""

                DELETED=0
                while IFS= read -r file; do
                        if [ -n "$file" ] && [ -f "$file" ]; then
                                rm -f "$file"
                                DELETED=$((DELETED + 1))
                                echo "  Deleted: $file"
                        fi
                done <<<"$DELETE_LIST"

                echo ""
                echo -e "${GREEN}✅ Cleaned $DELETED compiled files from src/ directories${NC}"
                echo ""
                echo "Next steps:"
                echo "  1. Run: bun run build"
                echo "  2. Run: bun run panopticon check --json"
                echo "  3. Verify zero LAW3G violations"
        fi
fi
