# Changelog Entry Format

Use this template for each new entry in `CHANGELOG.md`.

## Required fields
- Date: `YYYY-MM-DD` (local date)
- Commit: short hash (update after commit if needed)
- Summary: 1–3 bullets of what changed
- Why: reason and intent
- LLM Notes: where to look and how to apply downstream
- Impact: `None`, `Minor`, or `Breaking` with steps if breaking

## Template
```
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
```
