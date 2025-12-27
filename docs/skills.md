# Skills

Skills are modular instruction sets that help AI agents work effectively in this codebase. They provide specialized workflows, domain knowledge, and conventions.

Check out 
- [Anthropic Skills GitHub Repository](https://github.com/anthropics/skills/tree/main)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [Official Agent Skills Docs](https://agentskills.io/home)

## What Are Skills?

Skills are folders containing a `SKILL.md` file with optional resources (scripts, references, assets). AI agents load relevant skills based on context and follow the instructions within.

**Location:** `.agents/skills/`

## Available Skills

### `plan`

Enter planning mode before implementation. Researches the codebase, evaluates technologies, analyzes trade-offs, and documents decisions.

**Triggers:** "plan", "think through", "analyze", "evaluate approach"

**Output:** `.work/plans/backlog/<name>.md`

### `task`

Create well-defined task specifications from plans or user prompts. Defines what to build while leaving implementation open.

**Triggers:** "create task", "define task", "write spec", "break this down"

**Output:** `.work/tasks/backlog/<name>.md`

**Template:** `.skills/task/references/spec-template.md`

### `code-guidelines`

Apply this repo's coding conventions when writing or reviewing code.

**Covers:**
- Dependency injection patterns
- Error handling with `neverthrow` → [docs/neverthrow.md](neverthrow.md)
- Structured logging with pino → [docs/logging.md](logging.md)
- Testing strategies → [docs/testing.md](testing.md)

**Reference:** [code-guidelines.md](../code-guidelines.md)

### `doc-coauthoring`

Structured workflow for co-authoring documentation through context gathering, iterative refinement, and reader testing.

### `frontend-design`

Create distinctive, production-grade frontend interfaces. Avoids generic "AI slop" aesthetics.

### `skill-creator`

Guide for creating new skills. Use when extending Claude's capabilities with custom workflows.

### `resolve-pr-comments`

 Address GitHub PR review comments end-to-end, fetch unresolved review threads (via `gh` GraphQL), implement fixes, reply with what changed, and resolve threads using the bundled scripts.

## Work Tracking

Plans and tasks are tracked in `.work/`:

```
.work/
├── plans/
│   ├── backlog/      # Plans being drafted
│   └── completed/    # Approved plans
└── tasks/
    ├── backlog/      # Not started
    ├── in-progress/  # Currently active
    └── completed/    # Done
```

## Creating New Skills

See `.skills/skill-creator/SKILL.md` or [agentskills.io](https://agentskills.io) for the open standard.

Basic structure:

```
my-skill/
├── SKILL.md           # Required: frontmatter + instructions
├── references/        # Optional: docs loaded as needed
├── scripts/           # Optional: executable code
└── assets/            # Optional: templates, images
```

## Related Docs

- [code-guidelines.md](../code-guidelines.md) — Coding conventions
- [neverthrow.md](neverthrow.md) — Error handling
- [testing.md](testing.md) — Testing patterns
- [logging.md](logging.md) — Structured logging

