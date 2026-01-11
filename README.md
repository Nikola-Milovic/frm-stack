# Modern TypeScript Monorepo Template

This repo is a **demo monorepo template** meant to evolve into a clear, modern reference example, so I am inviting everyone to contribute to it and make it better.

Everything here is **illustrative, not prescriptive** — pick what you like, swap what you don’t (ORM/RPC/auth/testing/etc.).

If you’re reviewing this, I’d love feedback and PRs to help build it up.

Note: This kind of repo structure has served me really well in startups and in personal projects. If you have a bigger team, more enterprisey needs, you might want to consider a more traditional monorepo structure that people are more familiar with. If you have any questions you can reach out via email, twitter, github or wherever you find me.

## Intro

Please give your thoughts — the idea for this monorepo is to showcase how you might approach a monorepo that will grow with your company. It tries to balance DX with scalability/maintainability.

It’s a modern TypeScript Turbo monorepo with pnpm, Vite, React, Tailwind, shadcn/ui, Zod, neverthrow, pino, Postgres, Kysely, Atlas, Biome, Vitest, etc. This is close to what I use day-to-day in personal projects and client work.

Important: there are **no builds** for the main apps during dev (both frontend and backend are JIT). This repo is not meant to publish packages to npm.

## Technology choices

| Category | Choice | Why | Where | Docs |
|---|---|---|---|---|
| Monorepo | Turbo + pnpm workspaces/catalog | Fast task orchestration + centralized dependency versions | repo root | `turbo.json` |
| Frontend | Vite + React 19 + TanStack Router | Fast DX + simple routing | `apps/frontend/web` | (this README) |
| Mobile | Expo + React Native | Cross-platform native apps | `apps/frontend/mobile` | `docs/mobile.md` |
| UI | Tailwind + shadcn/ui | Speed + composable primitives | `packages/frontend/web` | (this README) |
| API | Hono + oRPC | Lightweight HTTP + end-to-end type-safe RPC | `apps/backend/api` | `docs/ORPC.md` |
| Auth | Better Auth | Batteries-included auth | `apps/backend/api/src/auth.ts` | `docs/AUTH.md` |
| DB | Postgres + Kysely | Typed query builder | `packages/backend/core/src/db.ts` | `docs/DB.md` |
| Schema/migrations | Atlas + `db/schema.sql` | SQL source-of-truth + deterministic apply | `db/schema.sql` + `just db-migrate` | `docs/DB.md` |
| Validation | Zod | Runtime validation + types | services/routers | `docs/CONFIG.md` |
| Errors | neverthrow | Explicit Result flow | services | `docs/NEVERTHROW.md` |
| Testing | Vitest + testcontainers | Real Postgres tests that are still fast | backend packages | `docs/TESTING.md` |
| Lint/format | Biome | One fast tool | repo root | `biome.json` |
| Logging | pino | Structured logs | backend apps | `docs/LOGGING.md` |

## Repo structure

- `apps/backend/api`: Hono server, Better Auth, oRPC router, services (user + todo), Vitest tests
- `apps/frontend/web`: Vite + React app (home page is the TODO CRUD demo)
- `apps/frontend/landing`: Astro static landing site (this repo's "front door")
- `apps/frontend/mobile`: Expo React Native mobile app (WIP Better Auth integration)
- `packages/backend/core`: shared backend core (DB, config, auth helpers, validation, test helpers, generated schema types)
- `packages/frontend/web`: shared UI/components library (shadcn components)
- `packages/shared/*`: shared configs + tiny example package (`hello`)
- `db/schema.sql`: canonical schema (used by Atlas and tests)
- `docs/`: concise “how this works” docs

## Getting started (non-Devbox path)

### Prerequisites

- Node.js (targets Node 24+)
- pnpm (see the pinned version in root `package.json`)
- Docker (for Postgres)
- Atlas + Just (recommended, because `just setup` uses them)

### Setup

1) Install deps:

```bash
pnpm install
```

2) Environment variables

- root (docker compose): copy `.env.example` → `.env` (only used by `compose.yml`)
- backend: copy `apps/backend/api/.env.example` → `apps/backend/api/.env`
- frontend: copy `apps/frontend/web/.env.development.example` → `apps/frontend/web/.env.development`
  - Note: Vite loads `.env` (shared across all modes) and `.env.[mode]` (mode-specific)
  - See `apps/frontend/web/.env.example` for more details on Vite's env loading order

3) Start Postgres + apply schema:

```bash
just setup
```

4) Start dev:

```bash
pnpm dev
```

## Getting started (Devbox option)

Devbox is optional, but convenient (installs Node/pnpm/Atlas/Just):

```bash
devbox shell
```

Then run the same steps (`pnpm install`, `just setup`, `pnpm dev`).

## Useful commands

- `pnpm dev` / `pnpm typecheck` / `pnpm lint:check` / `pnpm format:check` / `pnpm test`
- `pnpm -C apps/backend/api test`
- `pnpm -C apps/frontend/landing dev`
- `just setup` (docker + migrate), `just db-migrate` (schema “push”), `just db-schema`, `just db-psql`
- Versioned migrations (Atlas, still based on `db/schema.sql`):
  - `just db-migration-new add_todos`
  - `just db-migration-apply`
- Find improvement spots (all `TODO:` comments):
  - `rg -n "TODO:" .`
  - (fallback) `grep -RIn "TODO:" .`

## Known rough edges / help wanted

- Node/shared package HMR is still not great (would love best practices for “JIT workspace packages” + watch mode).
- Vitest + workspace “subpath imports” (`#*`) can be tricky. I currently work around it with a custom resolver plugin in `apps/backend/api/vitest.config.ts` (not sure if this is the best solution).
- The shared testcontainers singleton approach is intentionally aggressive for speed; I’m still evaluating whether it’s the right default long-term.

## CI/CD

- **Local**: Husky runs `lint:check`, `format:check`, and `typecheck` on `pre-push`.
- **CI**: GitHub Actions runs those checks + `pnpm test` on every PR.
- Details: `docs/CICD.md`.

## Docs

- `docs/orpc.md`
- `docs/db.md`
- `docs/auth.md`
- `docs/neverthrow.md`
- `docs/tech-choices.md`
- `docs/testing.md`
- `docs/cicd.md`
- `docs/vitest_config.md`
- `docs/config.md`
- `docs/logging.md`
- `docs/mobile.md`
- `docs/skills.md`

## Skills (AI Workflows)

Move skills into appropriate folder on your system or repository. Since each provider requires a different location, see your LLM provider docs for relevant locations, eg. Codex can be placed inside `.codex/skills/` while Claude can be placed inside `./.claude/skills/`

This repo includes [Skills](docs/skills.md) — modular instruction sets that help AI agents work effectively in this codebase.

Skills live in `.agents/skills/` and work tracking lives in `.work/`. See `docs/skills.md` for details.

## Contributing

See `CONTRIBUTING.md` and `code-guidelines.md` (LLMs are fine, but you’re responsible for correctness/security/licensing).

## License

MIT (see `LICENSE.md`).
