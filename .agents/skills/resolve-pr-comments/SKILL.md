---
name: resolve-pr-comments
description: Address GitHub PR review comments end-to-end, fetch unresolved review threads (via `gh` GraphQL), implement fixes, reply with what changed, and resolve threads using the bundled scripts. Use when asked to “address PR comments”, “resolve review threads”, or “clear requested changes”.
---

# Resolve PR Comments

Use this workflow when asked to “address PR comments”, “resolve review threads”, or “clear requested changes” on a GitHub pull request.

## Preconditions

- You are in the repo working tree for the PR.
- `gh auth status` succeeds and you have permission to comment/resolve threads.
- `jq` is installed (used by the helper scripts).

## Workflow

1. **Identify the PR for the current branch**
   - Prefer: `gh pr view --json number,url,headRefName,baseRefName --jq '{number,url,headRefName,baseRefName}'`
   - If no PR exists for the current branch, stop and ask the user what PR to target.

2. **Fetch unresolved review threads**
   - Run: `bash skills/resolve-pr-comments/scripts/fetch-unresolved-review-threads.sh`
   - If you need to target a different PR explicitly: `bash skills/resolve-pr-comments/scripts/fetch-unresolved-review-threads.sh 137`
   - This prints a JSON object with `{ pr, threads }` where `threads` includes only `isResolved=false`.

3. **Triage and decide action per thread**
   - If the comment is valid: implement the fix (prefer smallest change that satisfies intent).
   - If it’s incorrect / not applicable: reply explaining why (with concrete reasoning), then resolve.
   - If it requires product/architecture decision: reply with options + ask for direction; do **not** resolve unless the reviewer explicitly said it’s optional.
   - If it’s outdated (`isOutdated=true`): still reply with what changed + where, then resolve.

4. **Implement fixes**
   - Locate the referenced code by:
     - using `path`/`line` from the thread (when present), and/or
     - searching for identifiers mentioned in the comment.
   - Keep fixes scoped; do not refactor unrelated code.
   - Add/adjust tests where the comment implies a behavioral requirement.

5. **Reply + resolve**
   - Reply (keep it short; include file path and what changed):  
     `bash skills/resolve-pr-comments/scripts/reply-and-resolve-review-thread.sh '<THREAD_ID>' '<REPLY_BODY>'`
   - For longer replies, pass the body via stdin:
     - `cat <<'EOF' | bash skills/resolve-pr-comments/scripts/reply-and-resolve-review-thread.sh '<THREAD_ID>' -`
       - (write reply)
       - `EOF`
   - If you need to reply without resolving yet:  
     `bash skills/resolve-pr-comments/scripts/reply-to-review-thread.sh '<THREAD_ID>' '<REPLY_BODY>'`

## Notes

- Prefer resolving threads only after the code is updated (or you’ve explained why no change is needed).
- If CI is required for confidence, mention it in the reply (“will resolve after CI is green”) and avoid resolving prematurely.
