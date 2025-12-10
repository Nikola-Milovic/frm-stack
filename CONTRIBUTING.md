# Contributing

Thanks for taking a look. This repo is intentionally a WIP template/showcase — small, focused contributions are most helpful.

## Ground rules

- Be kind and constructive.
- Keep changes scoped; avoid drive-by refactors.
- Match existing code style (Biome) and patterns (Zod + neverthrow + oRPC).

## AI/LLM usage

Using LLMs (ChatGPT/Codex/etc.) is fine, but **you are responsible** for the output you submit:

- Verify correctness, security, and performance.
- Ensure you have the rights to contribute the code (no proprietary/copied code).
- Make sure tests pass and types check.

## Getting started

- Install prerequisites: Node, pnpm, Docker.
- Start Postgres + run schema migrations:
  - `just setup`
- Run the dev stack:
  - `pnpm dev`

Devbox is optional (convenience):
- `devbox shell`

## Quality bar

Before opening a PR:

- `pnpm typecheck`
- `pnpm lint:check`
- `pnpm format:check`
- `pnpm test`

## What to contribute

- Documentation improvements (README + `docs/*.md`)
- Small features that demonstrate patterns (e.g. TODO CRUD)
- Bug fixes with a test when practical

