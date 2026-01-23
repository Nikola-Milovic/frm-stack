#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: 'gh' (GitHub CLI) is required" >&2
  exit 1
fi

thread_id="${1:-}"
if [[ -z "$thread_id" ]]; then
  echo "usage: resolve-review-thread.sh <THREAD_ID>" >&2
  exit 2
fi

MUTATION='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { id isResolved }
  }
}
'

gh api graphql -f query="$MUTATION" -F threadId="$thread_id" >/dev/null
echo "ok"

