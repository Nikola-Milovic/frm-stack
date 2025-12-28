#!/usr/bin/env bash
#
# Development setup checker
# Verifies dependencies are installed and .env files exist

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

echo "Checking development setup..."
echo ""

# Check if dependencies are installed
echo "Checking dependencies..."
if [ -d "$ROOT_DIR/node_modules" ]; then
	echo -e "  ${GREEN}✓${NC} node_modules found"
else
	echo -e "  ${RED}✗${NC} node_modules not found - run 'pnpm install'"
	errors=$((errors + 1))
fi
echo ""

# Check for .env.example and .env.*.example files without corresponding .env files
echo "Checking environment files..."
missing_env=()

# Function to check if corresponding .env file exists
check_env_file() {
	local env_example="$1"
	local dir=$(dirname "$env_example")
	local basename=$(basename "$env_example")
	local relative_path="${env_example#$ROOT_DIR/}"

	# Extract the env file name by removing .example suffix
	# e.g., .env.example -> .env, .env.development.example -> .env.development
	local env_file="$dir/${basename%.example}"

	if [ -f "$env_file" ]; then
		echo -e "  ${GREEN}✓${NC} $relative_path has ${basename%.example}"
	else
		echo -e "  ${YELLOW}!${NC} $relative_path missing ${basename%.example}"
		missing_env+=("$relative_path")
	fi
}

# Find all .env.example files (base and mode-specific)
while IFS= read -r -d '' env_example; do
	check_env_file "$env_example"
done < <(find "$ROOT_DIR" \( -name ".env.example" -o -name ".env.*.example" \) -not -path "*/node_modules/*" -print0)

echo ""

# Summary
if [ ${#missing_env[@]} -gt 0 ]; then
	echo -e "${YELLOW}Missing .env files:${NC}"
	for file in "${missing_env[@]}"; do
		dir=$(dirname "$file")
		basename=$(basename "$file")
		target="${basename%.example}"
		echo "  cp $file $dir/$target"
	done
	echo ""
	errors=$((errors + ${#missing_env[@]}))
fi

if [ $errors -gt 0 ]; then
	echo -e "${RED}Setup incomplete - $errors issue(s) found${NC}"
	exit 1
else
	echo -e "${GREEN}Setup looks good!${NC}"
	exit 0
fi
