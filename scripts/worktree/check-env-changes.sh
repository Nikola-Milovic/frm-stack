#!/usr/bin/env bash
# Check for .env example file changes before merging
# Called by Worktrunk's pre-merge hook
# Warns users if any .env.example, .env.development, etc. files were modified

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Target branch to compare against (default: main)
TARGET_BRANCH="${1:-main}"

log_info "Checking for environment file changes compared to $TARGET_BRANCH..."

# Patterns for environment template files
ENV_PATTERNS=(
    '\.env\.example$'
    '\.env\.development$'
    '\.env\.local\.example$'
    '\.env\.template$'
    '\.env\.sample$'
)

# Build grep pattern
PATTERN=$(printf "|%s" "${ENV_PATTERNS[@]}")
PATTERN="${PATTERN:1}"  # Remove leading |

# Get changed files compared to target branch
CHANGED_ENV_FILES=$(git diff --name-only "$TARGET_BRANCH"...HEAD 2>/dev/null | grep -E "$PATTERN" || true)

if [ -z "$CHANGED_ENV_FILES" ]; then
    log_success "No environment template files changed"
    exit 0
fi

# Found changes - warn the user
echo ""
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}${BOLD}  ⚠️  Environment Template Files Changed!${NC}"
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}The following environment template files were modified in this branch:${NC}"
echo ""

while IFS= read -r file; do
    echo -e "  ${BLUE}•${NC} $file"
done <<< "$CHANGED_ENV_FILES"

echo ""
echo -e "${YELLOW}${BOLD}Action Required:${NC}"
echo -e "After merging, you may need to update your local .env files with new variables."
echo ""
echo -e "${BLUE}To see what changed:${NC}"
echo ""

while IFS= read -r file; do
    echo "  git diff $TARGET_BRANCH...HEAD -- $file"
done <<< "$CHANGED_ENV_FILES"

echo ""
echo -e "${GREEN}Tip:${NC} Compare the .env.example with your .env to see if you need to add new variables."
echo ""

# Exit with success - this is just a warning, not a blocker
exit 0

