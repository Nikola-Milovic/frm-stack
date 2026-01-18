# Worktree Workflow

This repository uses [Worktrunk](https://worktrunk.dev/) to manage git worktrees for parallel feature development. Each worktree is a separate working directory with its own:

- Working copy of the code
- Installed dependencies
- Environment configuration (`.env` files copied from main worktree)

> **Note**: All worktrees share the same ports. Only run one worktree's services at a time, or manually configure different ports if needed.

## Prerequisites

Install Worktrunk:

```bash
# macOS
brew install worktrunk/tap/worktrunk

# Linux (cargo)
cargo install worktrunk

# Or download from releases
# https://github.com/worktrunk/worktrunk/releases
```

Set up shell integration (required for `wt switch` to change directories):

```bash
wt config shell install
```

Or manually add to your shell config:

```bash
# bash (~/.bashrc)
eval "$(wt config shell init bash)"

# zsh (~/.zshrc)
eval "$(wt config shell init zsh)"

# fish (~/.config/fish/config.fish)
wt config shell init fish | source
```

## User Configuration

For non-bare repositories, you must configure the worktree path in your personal Worktrunk config:

```bash
wt config create
```

Edit `~/.config/worktrunk/config.toml` and set:

```toml
# Customize worktree path template
worktree-path = "../{{ branch | sanitize }}"

# Or use a different pattern like:
# worktree-path = "../{{ main_worktree }}.{{ branch | sanitize }}"

# Optional: LLM commit messages
[commit-generation]
command = "llm"
args = ["-m", "claude-haiku-4.5"]
```

> **Important**: The `worktree-path` setting is required for non-bare repos. It tells Worktrunk where to create new worktrees relative to the current worktree.

## Quick Start

### Creating a New Worktree

```bash
# Create and switch to a new worktree
wt switch -c feature/my-feature

# The post-create hook automatically:
# 1. Copies gitignored files (.env, node_modules/, caches) from main worktree
# 2. Sets up devbox/direnv if present
# 3. Runs pnpm install
```

### Working with Worktrees

```bash
# List all worktrees with status
wt list

# Switch between worktrees
wt switch main
wt switch feature/my-feature

# Switch to previous worktree
wt switch -

# Start services in your worktree
just d up -d
just setup  # Full setup including migrations
pnpm dev
```

### Cleaning Up

```bash
# Remove worktree and cleanup Docker/generated files
wt remove

# Or merge your work first
wt merge  # Squashes, rebases, merges to main, then removes
```

## How It Works

### Copying Gitignored Files

The `setup.sh` script eliminates cold starts by copying gitignored files (caches, dependencies, `.env` files) from the primary worktree to the new worktree using `rsync`. This runs automatically via the `post-create` hook.

All gitignored files are copied except `.git`. The script:
1. Lists all gitignored files using `git ls-files --ignored --exclude-standard -o`
2. Uses `rsync` for fast bulk copying
3. Handles missing source files gracefully (e.g., if some cached files were deleted)

### Environment Change Detection

When merging a branch, Worktrunk checks if any `.env.example` (or similar template) files were modified. If changes are detected, you'll see a warning:

```
⚠️  Environment Template Files Changed!

The following environment template files were modified in this branch:
  • apps/backend/api/.env.example

Action Required:
After merging, you may need to update your local .env files with new variables.
```

### Cleanup

When removing a worktree (`wt remove` or `wt merge`), the cleanup script:

1. Stops Docker containers and removes volumes (`docker compose down -v`)
2. Removes generated `.env` files

## Configuration

### Project Config (`.config/wt.toml`)

This file configures Worktrunk hooks for the repository:

```toml
[post-create]
setup = "bash scripts/worktree/setup.sh '{{ branch }}' '{{ primary_worktree_path }}'"
direnv = "cd {{ worktree_path }} && direnv allow || true"

[pre-remove]
cleanup = "bash scripts/worktree/cleanup.sh '{{ branch }}'"

[pre-merge]
typecheck = "pnpm typecheck"
lint = "pnpm lint:check"
format = "pnpm format:check"
env-check = "bash scripts/worktree/check-env-changes.sh"
```

The hooks run sequentially in the order defined:

1. **setup**: Copies gitignored files from the primary worktree using rsync, then runs `pnpm install`
2. **direnv**: Allows direnv in the new worktree directory

## Commands Reference

### Worktrunk Commands

| Command | Description |
|---------|-------------|
| `wt switch -c <branch>` | Create new worktree |
| `wt switch <branch>` | Switch to existing worktree |
| `wt list` | List all worktrees with status |
| `wt remove` | Remove current worktree |
| `wt merge` | Squash & merge to main, then remove |
| `wt merge --no-remove` | Merge but keep worktree |

## Typical Workflow

```bash
# 1. Start a new feature
wt switch -c feature/user-auth

# 2. Setup completes automatically, then start services
just setup  # Full setup with DB migrations and seed
pnpm dev

# 3. Work on your feature...
# Make changes, test at http://localhost:5173 (or your configured port)

# 4. When done, merge to main
wt merge
# This will:
# - Squash your commits
# - Rebase onto main
# - Run pre-merge hooks (typecheck, lint, env-check)
# - Warn if .env.example files changed
# - Fast-forward merge
# - Stop Docker and remove volumes
# - Remove the worktree

# 5. Or if you want to keep working
wt merge --no-remove
```

## Troubleshooting

### Port Conflicts

Since all worktrees use the same ports, you can only run one worktree's services at a time. If you get port conflicts:

```bash
# Stop services in all worktrees
docker compose down

# Or check what's using a port
ss -tuln | grep <port>
lsof -i :<port>
```

### Stale Worktrees

If worktree state gets corrupted:

```bash
# List git worktrees
git worktree list

# Prune stale worktree references
git worktree prune

# Force remove a worktree
git worktree remove --force <path>
```

### Environment Not Set Up

If `.env` files are missing:

```bash
# Manually run setup (copies gitignored files and installs dependencies)
# From the worktree that needs setup, provide the primary worktree path:
bash scripts/worktree/setup.sh "$(git branch --show-current)" "/path/to/main/worktree"
```

### Missing Environment Variables

If you get errors about missing env vars after pulling/merging:

```bash
# Check what changed in .env.example
git diff main -- '*.env.example' '*.env.development.example'

# Compare your .env with the template
diff .env .env.example
```

## Devbox Integration

If you use [Devbox](https://www.jetify.com/devbox) for reproducible development environments, the worktree hooks handle it automatically:

**On worktree creation (`post-create`):**

- The setup script copies `devbox.json`, `devbox.lock`, and `.envrc` (if gitignored) from the primary worktree
- Runs `direnv allow` to activate the environment

This ensures each worktree has the same Nix-based development environment as the primary worktree without needing to reinstall packages.

## Scripts

The worktree workflow is powered by three bash scripts in `scripts/worktree/`:

### `setup.sh`

- **When**: Runs automatically via `post-create` hook when creating a new worktree
- **What it does**:
  1. Copies all gitignored files from the primary worktree (node_modules, .env files, caches, etc.)
  2. Runs `pnpm install --frozen-lockfile`
  3. Prints a helpful summary with quick start commands
- **Location**: `scripts/worktree/setup.sh`

### `cleanup.sh`

- **When**: Runs automatically via `pre-remove` hook before deleting a worktree
- **What it does**:
  1. Stops Docker containers and removes volumes
  2. Removes generated `.env` files
- **Location**: `scripts/worktree/cleanup.sh`

### `check-env-changes.sh`

- **When**: Runs automatically via `pre-merge` hook before merging
- **What it does**:
  1. Checks if any `.env.example` or `.env.template` files were modified
  2. Warns you if changes were detected (doesn't block the merge)
  3. Suggests commands to see what changed
- **Location**: `scripts/worktree/check-env-changes.sh`

## Benefits

Using Worktrunk with this repository provides:

1. **Parallel Development**: Work on multiple features simultaneously without context switching
2. **Fast Setup**: Rsync copies reduce cold start time from minutes to seconds
3. **Clean Separation**: Each worktree has isolated dependencies, Docker volumes, and env files
4. **Safety**: Pre-merge hooks catch type/lint errors before merging
5. **Awareness**: Automatic warnings when environment templates change
6. **Simplified Cleanup**: One command removes both the worktree and all generated files

## Alternative: Bare Repository Workflow

For advanced users, Worktrunk also supports bare repositories where all worktrees are siblings:

```bash
# Clone as bare repo
git clone --bare git@github.com:yourname/repo.git repo.git
cd repo.git

# Configure user config
wt config create
# Set: worktree-path = "../{{ branch | sanitize }}"

# Create main worktree
wt switch -c main

# Create feature worktrees
wt switch -c feature/auth
```

This creates a structure like:
```
repo.git/           # bare repository
../main/            # main worktree
../feature-auth/    # feature worktree
```

See [Worktrunk docs](https://worktrunk.dev/) for more on bare repository workflows.
