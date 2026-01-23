---
name: template-changelog
description: Create and update CHANGELOG.md entries for this template repo with date, commit hash, summary, rationale, and downstream update notes. Use when making template changes or preparing a push that requires a changelog entry.
---

# Template Changelog

## Workflow

1. Determine whether the change modifies the template (code, config, docs, deps). If yes, add a changelog entry.
2. Add a new entry at the top of `## Entries` in `CHANGELOG.md` using the template in `references/changelog-format.md`.
3. Fill the date (`YYYY-MM-DD`) and short commit hash. If the hash is not known yet, use `TBD` and amend the commit before push.
4. Summarize what changed (1–3 bullets), why it changed, and add LLM notes with paths/commits to guide downstream updates.
5. Keep entries in reverse chronological order and avoid editing older entries except for corrections.

## Notes

- The pre-push hook blocks pushes that do not include a `CHANGELOG.md` change.
- If a change spans multiple areas, list the key files in the LLM notes.

## Resources

- `references/changelog-format.md`
