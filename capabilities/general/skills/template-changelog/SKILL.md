---
name: template-changelog
description: Create and update CHANGELOG.md entries for this template repo with date, previous commit hash, new commit subject, and summary/why/LLM notes/impact. Use when making template changes or preparing a push that requires a changelog entry.
---

# Template Changelog

## Workflow

1. Determine whether the change modifies the template (code, config, docs, deps). If yes, add a changelog entry.
2. Decide the commit subject (the single commit you will create for the change).
3. Record the previous commit hash (short): `git rev-parse --short HEAD`.
4. Add a new entry at the top of `## Entries` in `CHANGELOG.md` using the template in `references/changelog-format.md`.
5. Commit everything (template changes + `CHANGELOG.md`) in a single commit using the subject from step 2.
6. Keep entries in reverse chronological order and avoid editing older entries except for corrections.

## Notes

- The pre-push hook blocks pushes that do not include a `CHANGELOG.md` change.

## Resources

- `references/changelog-format.md`
