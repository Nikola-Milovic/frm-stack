#!/usr/bin/env bash
# Worktree setup script
# Called by Worktrunk's post-create hook
# Copies gitignored files and installs dependencies
#
# Usage: setup.sh <branch> [main_worktree_path]

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
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')}"
# Get main worktree path from argument (passed by wt tool)
MAIN_WORKTREE_ARG="${2:-}"

log_info "Setting up worktree for branch: $BRANCH"

# Copy all gitignored files from main worktree to current worktree
copy_gitignored_files() {
    local main_worktree="$MAIN_WORKTREE_ARG"

    if [[ -z "$main_worktree" ]]; then
        log_warn "Main worktree path not provided, skipping gitignored file copy"
        return 0
    fi

    # Normalize paths for comparison
    main_worktree="$(cd "$main_worktree" 2>/dev/null && pwd)" || true
    local current_worktree
    current_worktree="$(cd "$REPO_ROOT" && pwd)"

    if [[ -z "$main_worktree" ]]; then
        log_warn "Main worktree path not accessible, skipping gitignored file copy"
        return 0
    fi

    if [[ "$main_worktree" == "$current_worktree" ]]; then
        log_info "Already in main worktree, skipping gitignored file copy"
        return 0
    fi

    log_info "Copying gitignored files from main worktree..."
    log_info "  Source: $main_worktree"
    log_info "  Target: $current_worktree"

    cd "$main_worktree"

    # Create temp file with list of ignored files (excluding .git), null-terminated for special chars
    local filelist
    filelist="$(mktemp)"
    git ls-files --ignored --exclude-standard -o -z 2>/dev/null | tr '\0' '\n' | grep -v '^\.git' > "$filelist" || true

    local count
    count="$(wc -l < "$filelist" | tr -d ' ')"

    if [[ "$count" -gt 0 ]]; then
        # Use rsync for fast bulk copy
        local rsync_exit=0
        rsync -a --files-from="$filelist" "$main_worktree/" "$current_worktree/" 2>/dev/null || rsync_exit=$?

        # Exit 0 = success, 23 = partial transfer (some files missing), both are OK
        if [[ $rsync_exit -eq 0 ]]; then
            log_success "Copied $count gitignored files"
        elif [[ $rsync_exit -eq 23 ]]; then
            log_success "Copied gitignored files (some source files were missing)"
        else
            log_warn "rsync completed with warnings (exit code: $rsync_exit)"
        fi
    else
        log_info "No gitignored files to copy"
    fi

    rm -f "$filelist"
    cd "$REPO_ROOT"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies with pnpm..."

    cd "$REPO_ROOT"

    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
        log_success "Dependencies installed"
    else
        log_warn "pnpm not found, skipping dependency installation"
        log_warn "Run 'pnpm install' manually after activating your environment"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Worktree setup complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Branch: ${BLUE}$BRANCH${NC}"
    echo ""
    echo -e "${YELLOW}Quick Start:${NC}"
    echo "  1. Start Docker services:  just d up -d"
    echo "  2. Run migrations:         just db-migrate"
    echo "  3. Seed database:          just db-seed"
    echo "  4. Start dev servers:      pnpm dev"
    echo ""
    echo -e "${YELLOW}Or run full setup:${NC}  just setup"
    echo ""
    echo -e "${YELLOW}Tip:${NC} Add this alias to your shell for devbox shorthand:"
    echo "  alias dv='devbox run'"
    echo ""
}

# Main execution
main() {
    copy_gitignored_files
    install_dependencies
    print_summary
}

main "$@"
