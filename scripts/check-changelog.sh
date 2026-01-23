#!/usr/bin/env sh
set -e

CHANGELOG_FILE="CHANGELOG.md"
ZERO_SHA="0000000000000000000000000000000000000000"

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "ERROR: $CHANGELOG_FILE is missing. Add it before pushing."
  exit 1
fi

missing=0

while read -r local_ref local_sha remote_ref remote_sha
do
  if [ "$local_sha" = "$ZERO_SHA" ]; then
    continue
  fi

  if [ "$remote_sha" = "$ZERO_SHA" ]; then
    commits="$(git rev-list "$local_sha" --not --remotes)"
  else
    commits="$(git rev-list "$remote_sha..$local_sha")"
  fi

  if [ -z "$commits" ]; then
    continue
  fi

  if ! git diff-tree --no-commit-id --name-only -r $commits | grep -qx "$CHANGELOG_FILE"; then
    echo "ERROR: No $CHANGELOG_FILE update found in commits being pushed for $local_ref."
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "Add a changelog entry before pushing."
  exit 1
fi
