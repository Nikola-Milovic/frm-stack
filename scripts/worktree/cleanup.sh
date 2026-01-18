#!/usr/bin/env bash
# Worktree cleanup script
# Called by Worktrunk's pre-remove hook
# Cleans up Docker resources and generated files in the worktree

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Get branch name from argument or current git branch
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')}"

if [ -z "$BRANCH" ]; then
    log_error "Could not determine branch name"
    log_error "Usage: cleanup.sh <branch-name>"
    exit 1
fi

log_info "Cleaning up worktree for branch: $BRANCH"

# Stop and remove Docker containers and volumes
cleanup_docker() {
    log_info "Stopping Docker containers and removing volumes..."

    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found, skipping Docker cleanup"
        return 0
    fi

    cd "$REPO_ROOT"

    # Check if docker compose is available and has running containers
    if docker compose ps -q 2>/dev/null | grep -q .; then
        docker compose down -v --remove-orphans 2>/dev/null || true
        log_success "Docker containers stopped and volumes removed"
    else
        log_info "No running Docker containers found"
    fi
}

# Clean up generated .env files
# These are created from .env*.example templates
cleanup_env_files() {
    log_info "Cleaning up generated .env files..."

    local removed=0

    # Find all .env example files and remove their generated counterparts
    while IFS= read -r -d '' example_file; do
        local generated="${example_file%.example}"
        if [ -f "$generated" ]; then
            rm -f "$generated"
            log_info "Removed: $generated"
            removed=$((removed + 1))
        fi
    done < <(find "$REPO_ROOT" -name ".env*.example" -print0 2>/dev/null)

    if [ "$removed" -gt 0 ]; then
        log_success "Removed $removed .env files"
    else
        log_info "No .env files to remove"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Worktree cleanup complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Branch: ${BLUE}$BRANCH${NC}"
    echo ""
}

# Main execution
main() {
    cleanup_docker
    cleanup_env_files
    print_summary
}

main "$@"
