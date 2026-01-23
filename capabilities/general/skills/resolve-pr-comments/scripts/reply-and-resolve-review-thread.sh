#!/usr/bin/env bash
set -euo pipefail

thread_id="${1:-}"
body_arg="${2:-}"

if [[ -z "$thread_id" ]]; then
  echo "usage: reply-and-resolve-review-thread.sh <THREAD_ID> <REPLY_BODY | ->" >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${body_arg}" ]]; then
  "$script_dir/reply-to-review-thread.sh" "$thread_id" -
else
  "$script_dir/reply-to-review-thread.sh" "$thread_id" "$body_arg"
fi

"$script_dir/resolve-review-thread.sh" "$thread_id"
echo "ok"

