# Changelog Entry Format

Use this template for each new entry in `CHANGELOG.md`.

## Required fields
- Date: `YYYY-MM-DD` (local date)
- Change Ref: short hash of the commit that introduced the change
  - If the changelog entry is in a follow-up commit, reference the previous commit hash
  - If using a single commit, use the commit subject as the change ref
  - If no hash yet, use `TBD` and amend before push
- Summary: 1–3 bullets of what changed
- Why: reason and intent
- LLM Notes: where to look and how to apply downstream
- Impact: `None`, `Minor`, or `Breaking` with steps if breaking

## Template
```
### YYYY-MM-DD — <change-ref>
- Summary:
  - ...
- Why:
  - ...
- LLM Notes:
  - To apply elsewhere: see <path> / <commit>
  - Key files: ...
- Impact:
  - None | Minor | Breaking (include steps)
```
