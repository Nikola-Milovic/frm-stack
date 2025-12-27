#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: 'gh' (GitHub CLI) is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: 'jq' is required" >&2
  exit 1
fi

pr_number="${1:-}"

repo_full="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
owner="${repo_full%%/*}"
name="${repo_full#*/}"

if [[ -z "${pr_number}" ]]; then
  if ! pr_number="$(gh pr view --json number --jq '.number' 2>/dev/null)"; then
    echo "error: no PR found for the current branch; pass a PR number explicitly" >&2
    exit 1
  fi
fi

QUERY='
query($owner:String!, $name:String!, $number:Int!, $cursor:String) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      number
      url
      title
      reviewThreads(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          diffSide
          comments(first: 50) {
            nodes {
              id
              url
              body
              createdAt
              author { login }
            }
          }
        }
      }
    }
  }
}
'

all_threads='[]'
cursor=""
pr_meta=""

while :; do
  if [[ -n "$cursor" ]]; then
    response="$(gh api graphql -f query="$QUERY" -F owner="$owner" -F name="$name" -F number="$pr_number" -F cursor="$cursor")"
  else
    response="$(gh api graphql -f query="$QUERY" -F owner="$owner" -F name="$name" -F number="$pr_number")"
  fi

  if [[ -z "$pr_meta" ]]; then
    pr_meta="$(jq '.data.repository.pullRequest | {number,url,title}' <<<"$response")"
  fi

  page_nodes="$(jq '.data.repository.pullRequest.reviewThreads.nodes' <<<"$response")"
  all_threads="$(jq -s '.[0] + .[1]' <(printf '%s' "$all_threads") <(printf '%s' "$page_nodes"))"

  has_next="$(jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage' <<<"$response")"
  cursor="$(jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // empty' <<<"$response")"

  if [[ "$has_next" != "true" ]]; then
    break
  fi
done

unresolved_threads="$(jq '[ .[] | select(.isResolved == false) ]' <<<"$all_threads")"

jq -n \
  --arg repo "$repo_full" \
  --argjson pr "$pr_meta" \
  --argjson threads "$unresolved_threads" \
  '{pr: ($pr + {repo: $repo}), threads: $threads}'

