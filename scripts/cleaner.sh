#!/bin/bash

# Clean the monorepo
# turbo run clean                                                 # pnpm workspaces run clean

# Clean all node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some node_modules directories."

# Clean all dist directories
find . -name "dist" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some dist directories."

find . -name ".turbo" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some turbo directories."

find . -name ".next" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .next directories."

find . -name "coverage" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some coverage directories."

# Clean Expo directories (React Native development)
find . -name ".expo" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .expo directories."
find . -name ".expo-shared" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .expo-shared directories."

# Clean Android build directories
find . -name ".gradle" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .gradle directories."
find . -path "*/android/build" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some android/build directories."

# Clean iOS build directories
find . -path "*/ios/Pods" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some ios/Pods directories."
find . -path "*/ios/build" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some ios/build directories."

# Clean other common cache directories
find . -name ".cache" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .cache directories."
find . -name ".parcel-cache" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some parcel-cache directories."
find . -name ".vercel" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .vercel directories."
find . -name ".netlify" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some .netlify directories."
# Clean test result directories
find . -name "__snapshots__" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some __snapshots__ directories."
find . -path "*/node_modules/.cache" -type d -prune -exec rm -rf '{}' + || echo "Failed to remove some node_modules/.cache directories."
LOCK_FILES=("package-lock.json" "pnpm-lock.yaml" "yarn.lock")
for lock_file in "${LOCK_FILES[@]}"; do
    find . -name "$lock_file" -type f -not -path "*/node_modules/*" -delete || echo "Failed to delete $lock_file"
done

# Remove local environment files
find . -name ".env.local" -type f -delete || echo "Failed to delete .env.local files."
find . -name ".env.*.local" -type f -delete || echo "Failed to delete .env.*.local files."

# Remove any build artifacts (optional)
find . -name "*.log" -type f -delete || echo "Failed to delete log files."
find . -name "*.tmp" -type f -delete || echo "Failed to delete temporary files."
find . -name "*.tsbuildinfo" -type f -delete || echo "Failed to delete temporary .tsbuildinfo files."


# Remove previous repomix output files if they exist
# OUTPUT_FILES=("repomix-*" "repomix-db.txt")
# for output_file in "${OUTPUT_FILES[@]}"; do
#    rm -f "$output_file"
#done

# Generate new repomix output files



echo "Clean-up complete."

# Prune pnpm store cache
pnpm store prune || echo "Failed to prune pnpm store."

# Install dependencies using pnpm
pnpm install

# Wait for 5 seconds to ensure all installations are settled
sleep 5


# Commit changes with a message
git add pnpm-lock.yaml
git commit -m "Pnpm packages and update lock file"

echo "Clean-up script complete."
