# Changelog

All template changes must be logged here. See `.agents/skills/template-changelog` for the rules and entry format.

## Template
### YYYY-MM-DD — <short-hash>
- Summary:
  - ...
- Why:
  - ...
- LLM Notes:
  - To apply elsewhere: see <path> / <commit>
  - Key files: ...
- Impact:
  - None | Minor | Breaking (include steps)

## Entries
### 2026-01-23 — cd06485
- Summary:
  - Add CHANGELOG.md with required entry format.
  - Add pre-push enforcement for changelog updates.
  - Add a template-changelog skill for LLM guidance.
- Why:
  - Track template changes with dates, commits, rationale, and downstream update notes.
- LLM Notes:
  - Entry format is in this file and `.agents/skills/template-changelog`.
  - Hook logic lives in `.husky/pre-push` and `scripts/check-changelog.sh`.
- Impact:
  - None.
