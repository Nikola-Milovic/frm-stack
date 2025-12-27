#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: 'gh' (GitHub CLI) is required" >&2
  exit 1
fi

thread_id="${1:-}"
body_arg="${2:-}"

if [[ -z "$thread_id" ]]; then
  echo "usage: reply-to-review-thread.sh <THREAD_ID> <REPLY_BODY | ->" >&2
  exit 2
fi

if [[ -z "$body_arg" || "$body_arg" == "-" ]]; then
  reply_body="$(cat)"
else
  reply_body="$body_arg"
fi

if [[ -z "${reply_body// }" ]]; then
  echo "error: reply body is empty" >&2
  exit 2
fi

MUTATION='
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $threadId, body: $body}) {
    comment { id url }
  }
}
'

gh api graphql -f query="$MUTATION" -F threadId="$thread_id" -F body="$reply_body" >/dev/null
echo "ok"

