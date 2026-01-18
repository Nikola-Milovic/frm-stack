#!/usr/bin/env bash
set -euo pipefail

# Converts a regular git repository into a "bare repo + worktrees" layout.
#
# Result (default):
#   repo-root/            (becomes the container + bare repo)
#     .git/               (bare repo data)
#     main/               (worktree for branch "main")
#     feature-x/          (worktree for branch "feature-x")
#     _old_root_worktree_<timestamp>/  (moved aside original working tree files)
#
# IMPORTANT:
# - Run this from the repo root of a *regular* repo (where .git is a directory).
# - After conversion, run tools like lazygit inside a worktree directory (e.g. ./main),
#   not in the bare container directory.

# Colors for output (matches other scripts in this repo)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

usage() {
  cat <<'EOF'
Usage:
  bash scripts/worktree/convert-to-bare-worktrees.sh [options]

Options:
  --primary <branch>         Branch to treat as the primary/default (defaults to current branch, else "main", else first local branch)
  --worktrees-root <dir>     Where to create worktrees relative to repo root (default: ".")
                             Example: --worktrees-root worktrees  => worktrees/main, worktrees/feature-a, ...
  --fetch                    After conversion, run `git fetch --prune origin` (best-effort)
  --no-backup                Skip creating a tarball backup
  --backup-dir <dir>         Where to write the tarball backup (default: parent dir "..")
  --force                    Proceed even if working tree is dirty / repo already has extra worktrees
  --dry-run                  Print what would happen, but do not change anything
  -h, --help                 Show help

Notes:
  - This script only converts the *main working tree* repo. If you're already in a linked worktree
    (where .git is a file containing "gitdir:"), run this from the original non-worktree repo root instead.
  - After conversion, open lazygit inside a worktree (e.g. `cd main && lazygit`) or use `lazygit -p main`.
EOF
}

DRY_RUN=0
FORCE=0
DO_BACKUP=1
BACKUP_DIR=".."
DO_FETCH=0
WORKTREES_ROOT="."
PRIMARY_BRANCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --primary)
      PRIMARY_BRANCH="${2:-}"; shift 2 ;;
    --worktrees-root)
      WORKTREES_ROOT="${2:-}"; shift 2 ;;
    --backup-dir)
      BACKUP_DIR="${2:-}"; shift 2 ;;
    --no-backup)
      DO_BACKUP=0; shift ;;
    --fetch)
      DO_FETCH=1; shift ;;
    --force)
      FORCE=1; shift ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      log_error "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '%b ' "${YELLOW}[DRY-RUN]${NC}"
    printf '%q ' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_error "Missing required command: $1"
    exit 1
  fi
}

sanitize_branch() {
  # Keep paths simple and avoid nesting for branch names like feature/foo.
  # If you want nested dirs, use --worktrees-root and/or edit this.
  local branch="$1"
  branch="${branch//\//-}"
  echo "$branch"
}

top_level_name() {
  # Returns the first path component (for excluding from cleanup).
  local path="$1"
  path="${path#./}"
  if [[ "$path" == *"/"* ]]; then
    echo "${path%%/*}"
  else
    echo "$path"
  fi
}

main() {
  require_cmd git
  require_cmd tar
  require_cmd find

  local repo_root
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    log_error "Not inside a Git repository."
    exit 1
  }
  cd "$repo_root"

  if [[ -f ".git" ]]; then
    log_error "This looks like a linked worktree (.git is a file)."
    log_error "Run this from the original repo root where .git is a directory."
    exit 1
  fi
  if [[ ! -d ".git" ]]; then
    log_error "Expected .git/ directory in repo root, but it was not found."
    exit 1
  fi
  if [[ "$(git rev-parse --is-bare-repository)" == "true" ]]; then
    log_error "Repository is already bare. Nothing to convert."
    exit 1
  fi

  # If there are already additional worktrees, conversion becomes ambiguous.
  local worktree_count
  worktree_count="$(git worktree list --porcelain | awk '/^worktree /{c++} END{print c+0}')"
  if [[ "$worktree_count" -gt 1 && "$FORCE" -ne 1 ]]; then
    log_error "This repository already has multiple worktrees ($worktree_count)."
    log_error "Refusing to convert automatically. Re-run with --force if you know what you're doing."
    exit 1
  fi

  if [[ "$FORCE" -ne 1 ]]; then
    if [[ -n "$(git status --porcelain)" ]]; then
      log_error "Working tree is not clean. Commit/stash your changes, or re-run with --force."
      exit 1
    fi
  else
    log_warn "--force enabled: proceeding even if working tree is dirty or multiple worktrees exist."
  fi

  mapfile -t branches < <(git for-each-ref refs/heads --format='%(refname:short)')
  if [[ "${#branches[@]}" -eq 0 ]]; then
    log_error "No local branches found under refs/heads."
    exit 1
  fi

  local current_branch=""
  current_branch="$(git symbolic-ref --short -q HEAD 2>/dev/null || true)"

  if [[ -z "$PRIMARY_BRANCH" ]]; then
    if [[ -n "$current_branch" ]]; then
      PRIMARY_BRANCH="$current_branch"
    elif git show-ref --verify --quiet refs/heads/main; then
      PRIMARY_BRANCH="main"
    else
      PRIMARY_BRANCH="${branches[0]}"
    fi
  fi

  if ! git show-ref --verify --quiet "refs/heads/$PRIMARY_BRANCH"; then
    log_error "Primary branch '$PRIMARY_BRANCH' does not exist locally."
    exit 1
  fi

  # Build worktree destinations and ensure we won't collide.
  declare -A dir_for_branch=()
  declare -A preserve_top=()
  preserve_top[".git"]=1

  local worktrees_root_clean="$WORKTREES_ROOT"
  worktrees_root_clean="${worktrees_root_clean%/}"
  if [[ -z "$worktrees_root_clean" ]]; then
    worktrees_root_clean="."
  fi

  for branch in "${branches[@]}"; do
    local dir_name
    dir_name="$(sanitize_branch "$branch")"

    local dest
    if [[ "$worktrees_root_clean" == "." ]]; then
      dest="./$dir_name"
    else
      dest="./$worktrees_root_clean/$dir_name"
    fi

    if [[ -e "$dest" ]]; then
      log_error "Destination already exists: $dest (branch: $branch)"
      log_error "Pick a different --worktrees-root, or rename/remove the path."
      exit 1
    fi

    dir_for_branch["$branch"]="$dest"
    preserve_top["$(top_level_name "$dest")"]=1
  done

  local repo_name timestamp backup_path
  repo_name="$(basename "$repo_root")"
  timestamp="$(date +%Y%m%d_%H%M%S)"
  backup_path="$BACKUP_DIR/${repo_name}_backup_${timestamp}.tar.gz"

  if [[ "$DO_BACKUP" -eq 1 ]]; then
    log_info "Creating backup tarball at: $backup_path"
    # Exclude common heavy caches (safe to regenerate); keep .git.
    run tar -czf "$backup_path" \
      --exclude="./node_modules" \
      --exclude="./.turbo" \
      --exclude="./.pnpm-store" \
      -C "$(dirname "$repo_root")" "$(basename "$repo_root")"
    log_success "Backup created."
  else
    log_warn "Skipping backup (--no-backup)."
  fi

  # Detach HEAD in the root working tree to free the current branch for a linked worktree.
  local head_commit
  head_commit="$(git rev-parse HEAD)"
  log_info "Detaching HEAD in repo root (commit: $head_commit)"
  run git checkout --detach "$head_commit"

  # Create worktrees for each local branch.
  for branch in "${branches[@]}"; do
    local dest="${dir_for_branch[$branch]}"
    log_info "Creating worktree: $branch -> $dest"
    run mkdir -p "$(dirname "$dest")"
    run git worktree add "$dest" "$branch"
  done

  # Run setup script for each worktree to copy gitignored files and install dependencies
  log_info "Running setup for each worktree..."

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log_info "Would run setup.sh for each worktree (copies .env, node_modules, etc. and runs pnpm install)"
  else
    for branch in "${branches[@]}"; do
      local dest="${dir_for_branch[$branch]}"
      log_info "  → Setting up: $dest"

      # Run setup.sh from the new worktree, passing the current repo root as the source
      (cd "$dest" && bash scripts/worktree/setup.sh "$branch" "$repo_root") || {
        log_warn "Setup script failed for $dest, continuing..."
      }
    done
    log_success "All worktrees set up"
  fi

  # Convert the common .git directory into a bare repo config.
  log_info "Marking repo as bare (core.bare=true) and setting HEAD -> $PRIMARY_BRANCH"
  run git --git-dir=.git config core.bare true
  run git --git-dir=.git symbolic-ref HEAD "refs/heads/$PRIMARY_BRANCH"

  # Ensure origin has a fetch refspec so remote-tracking branches work (origin/main, etc.)
  local origin_url origin_fetch
  origin_url="$(git --git-dir=.git config --get remote.origin.url 2>/dev/null || true)"
  origin_fetch="$(git --git-dir=.git config --get-all remote.origin.fetch 2>/dev/null || true)"
  if [[ -n "$origin_url" && -z "$origin_fetch" ]]; then
    log_warn "remote.origin.fetch is not set; adding standard refspec so origin/* tracking branches appear."
    run git --git-dir=.git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
  fi

  if [[ "$DO_FETCH" -eq 1 && -n "$origin_url" ]]; then
    log_info "Fetching origin (best-effort): git fetch --prune origin"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      printf '%b\n' "${YELLOW}[DRY-RUN]${NC} git --git-dir=.git fetch --prune origin"
    else
      git --git-dir=.git fetch --prune origin || log_warn "Fetch failed (network/auth). You can run it later from any worktree."
    fi
  fi

  # Move aside the original root working tree files (now redundant).
  local staging="_old_root_worktree_${timestamp}"
  preserve_top["$staging"]=1

  log_info "Moving aside original root working tree files into: $staging/"
  run mkdir -p "$staging"

  # Build find args to exclude .git and preserved top-level dirs (worktrees-root and/or worktree dirs).
  local find_args=(. -mindepth 1 -maxdepth 1)
  for name in "${!preserve_top[@]}"; do
    find_args+=( ! -name "$name" )
  done

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '%b\n' "${YELLOW}[DRY-RUN]${NC} would move these entries from repo root:"
    find "${find_args[@]}" -print | sed 's#^\./##' || true
  else
    while IFS= read -r -d '' entry; do
      mv "$entry" "$staging/"
    done < <(find "${find_args[@]}" -print0)
  fi

  log_success "Conversion complete."
  echo ""
  echo "Next:"
  echo "  - Use a worktree:   cd \"${dir_for_branch[$PRIMARY_BRANCH]}\""
  echo "  - Open lazygit:     lazygit   (or from container dir: lazygit -p \"${dir_for_branch[$PRIMARY_BRANCH]#./}\")"
  echo "  - Verify worktrees: git --git-dir=.git worktree list"
  echo ""
  echo "If everything looks good, you can delete: $staging/ (and the tarball backup if you created one)."
}

main "$@"
