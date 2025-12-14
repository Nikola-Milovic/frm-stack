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

# Check for .env.example files without corresponding .env
echo "Checking environment files..."
missing_env=()

while IFS= read -r -d '' env_example; do
	dir=$(dirname "$env_example")
	env_file="$dir/.env"
	relative_path="${env_example#$ROOT_DIR/}"

	if [ -f "$env_file" ]; then
		echo -e "  ${GREEN}✓${NC} $relative_path has .env"
	else
		echo -e "  ${YELLOW}!${NC} $relative_path missing .env"
		missing_env+=("$relative_path")
	fi
done < <(find "$ROOT_DIR" -name ".env.example" -not -path "*/node_modules/*" -print0)

echo ""

# Summary
if [ ${#missing_env[@]} -gt 0 ]; then
	echo -e "${YELLOW}Missing .env files:${NC}"
	for file in "${missing_env[@]}"; do
		dir=$(dirname "$file")
		echo "  cp $file $dir/.env"
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
