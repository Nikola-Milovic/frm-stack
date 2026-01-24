# Changelog Entry Format

Use this template for each new entry in `CHANGELOG.md`.

## Required fields
- Date: `YYYY-MM-DD` (local date)
- Prev Ref: short hash of the commit immediately before the change commit
- Commit Subject: subject line of the change commit (the single commit that includes the template changes + changelog)
- Summary: 1–3 bullets of what changed
- Why: reason and intent
- LLM Notes: where to look and how to apply downstream
- Impact: `None`, `Minor`, or `Breaking` with steps if breaking

## Template
```
### YYYY-MM-DD — <prev-ref> — <commit-subject>
- Summary:
  - ...
- Why:
  - ...
- LLM Notes:
  - To apply elsewhere: see <path>
  - Key files: ...
- Impact:
  - None | Minor | Breaking (include steps)
```
