# Project Plan (WIP)

This file is the single source of truth for what needs doing before publishing this repo (and for collecting feedback without losing track).

## Snapshot (What’s in the repo today)

### Monorepo layout

- `apps/backend/api`: Hono server + Better Auth + oRPC router + services (currently `user`) + Vitest tests
- `apps/frontend/web`: Vite + React 19 + React Router + TanStack Query + oRPC client + Tailwind/shadcn UI
- `packages/backend/core`: shared backend core (DB, config, auth helpers, validation, test helpers, generated schema types)
- `packages/frontend/web`: shared UI/components library (shadcn components + small utilities)
- `packages/shared/*`: shared configs + small example package (`hello`)
- `db/schema.sql`: canonical DB schema used by Atlas and by tests (applied into Postgres)
- `docs/`: currently testing notes (`TESTING.md`)
- Tooling: Turbo (`turbo.json`), Biome (`biome.json`), Devbox (`devbox.json`), Docker Compose (`compose.yml`), `justfile`

### Primary technology choices (current)

- **TypeScript** everywhere, ESM packages
- **Frontend:** Vite + React 19 + React Router + Tailwind + shadcn/ui + TanStack Query
- **Backend:** Hono + Better Auth + oRPC (type-safe RPC)
- **DB:** PostgreSQL + Kysely; schema management via Atlas (`just db-migrate`)
- **Validation:** Zod
- **Error handling:** neverthrow (Result-based flow in services)
- **Logging:** pino / pino-pretty
- **Quality:** Biome (format/lint), Vitest + testcontainers (shared Postgres pattern)

## Goals

- Make the repository easy to understand for **newcomers** (README + docs).
- Make it easy for reviewers to give **targeted feedback** on architecture and tech choices.
- Add a small “real” feature (**TODO CRUD**) to demonstrate patterns end-to-end.
- Do cleanup so the repo is publishable on GitHub (polish + consistency, not “perfect”).

## Decisions (locked in)

- TODO demo is **full-stack** and the UI lives in `apps/frontend/web/app/pages/index.tsx` (replace the current technology overview).
- `/health` stays a **plain HTTP endpoint** (not oRPC).
- No build/JIT is the approach **locally and in CI**; we are **not publishing packages** from this repo.
- README should document the **non-Devbox setup path first**; Devbox is an optional convenience path.
- License is **MIT** (request contributions back via docs/norms, not legal enforcement).

## Non-goals (for this iteration)

- Production deployment guides for every host/platform
- Full UI/UX polish for every screen
- Exhaustive documentation for every package

## Work items

### 1) README revamp (friendly + followable)

- [ ] Add a **top-of-file warning** banner: “NOT FINAL / assembled quickly for feedback” + what kind of feedback is wanted
- [ ] Explain **who this is for** (template/showcase) and the “why” behind the stack
- [ ] Add “**Quickstart**” (happy path) using existing tooling (non-Devbox first, Devbox as optional):
  - Install prerequisites (Node, pnpm, Docker, Atlas, Just)
  - (Optional) `devbox shell` for a one-command toolchain
  - `just setup` (docker compose + migrate)
  - `pnpm dev` (or `just start`)
- [ ] Add “**Requirements**” section (Node, pnpm, Docker, Atlas; or Devbox)
- [ ] Add “**Repo structure**” section with short explanations for `apps/*` and `packages/*`
- [ ] Add “**Common commands**” section:
  - `pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`
  - `just db-migrate`, `just db-schema`, `just d …`
- [ ] Add “**Env configuration**” section and point to `.env.example` plus app-specific `.env` files
- [ ] Add “**Testing**” section linking to `docs/TESTING.md`
- [ ] Add “**Feedback prompts**” section (questions you want reviewers to answer)
- [ ] Add “**Known rough edges**” section (examples below) so reviewers aren’t surprised

### 2) Architecture feedback + improvement candidates (documented)

Create a “feedback + improvements” section (README and/or a dedicated doc) that explicitly asks for critique.

- [ ] In README, include a “**What would you change?**” section with concrete prompts:
  - boundary between `apps/*` and `packages/*`
  - service/router layering
  - error handling style (`neverthrow` + typed errors)
  - DB schema + codegen approach
  - testing approach (shared container + TRUNCATE)
- [ ] Track current rough edges (to be fixed or intentionally left as tradeoffs):
  - [ ] Root `package.json` uses `engine` (likely should be `engines`)
  - [ ] `.env.example` is incomplete vs backend/frontend runtime config
  - [ ] `db/init.sql` exists as a directory (likely accidental)
  - [ ] Clarify “JIT/no build” story for packages vs presence of `dist/` in some packages
  - [ ] Keep health as plain HTTP route (intentional)

### 3) Follow-up blog post (structure + choices)

Decide where the blog post lives (repo `docs/` is fine).

- [ ] Add `docs/blog/` (or `docs/posts/`) and create a post file (date-stamped)
- [ ] Outline:
  - [ ] Why Turbo monorepo + pnpm catalogs
  - [ ] App/package boundaries and “how imports work”
  - [ ] Backend architecture: Hono + Better Auth + oRPC + services
  - [ ] DB workflow: `db/schema.sql` + Atlas + Kysely + codegen
  - [ ] Error handling: neverthrow conventions and tradeoffs
  - [ ] Testing: testcontainers shared DB pattern + why threads pool matters
  - [ ] What’s intentionally incomplete / next steps

### 4) `docs/*.md` (concise, LLM-friendly docs)

Create short docs with a consistent format:
**Purpose → Where used → How to use → Conventions → Gotchas → Links**.

- [x] `docs/ORPC.md`: router composition, inputs/outputs, error mapping, client usage
- [x] `docs/NEVERTHROW.md`: Result patterns, `fromAsyncThrowable`, error typing, logging guidelines
- [x] `docs/TESTING.md`: keep as is + add a short “TL;DR” section at top
- [x] `docs/DB.md`: schema source of truth, Atlas workflow, Kysely usage, codegen (`just db-schema`)
- [x] `docs/AUTH.md`: Better Auth integration, sessions, middleware, cookie config
- [x] `docs/CONFIG.md`: Zod config parsing, env vars, local dev defaults
- [x] `docs/LOGGING.md`: pino usage patterns and what to log/avoid logging
- [ ] Consider a short `docs/README.md` index if docs grow

### 5) Add TODO CRUD (router + service + DB table)

Backend-first feature to demonstrate the patterns end-to-end.

**Database**
- [x] Add `todos` table to `db/schema.sql` (include FK to `users`)
  - Suggested columns: `id uuid pk`, `user_id uuid fk`, `title text`, `completed boolean`, `created_at`, `updated_at`
  - Suggested indexes: `(user_id)`, maybe `(user_id, completed)`
- [ ] Apply schema locally via `just db-migrate`
- [ ] Regenerate Kysely types via `just db-schema` (updates `packages/backend/core/src/schema.ts`) (manual update done; still recommended)

**Backend core (types/helpers)**
- [x] Add `Todo` type in `packages/backend/core/src/types.ts` (and any helper types as needed)

**API service**
- [x] Create `apps/backend/api/src/services/todo.ts`
  - [x] Zod schemas for create/update/list/get/delete inputs
  - [x] Service methods returning `Result<… , Error>` using neverthrow
  - [x] Enforce per-user access (cannot read/write other users’ todos)

**API router**
- [x] Create `apps/backend/api/src/routers/todo.ts` and register it in `apps/backend/api/src/routers/index.ts`
  - [x] Use `authOnly` middleware for all TODO operations
  - [x] Map domain errors to oRPC errors consistently (401/404/400/500)

**Tests**
- [x] Add service tests similar to `apps/backend/api/src/services/user.test.ts`
  - [x] create/list/update/delete happy paths
  - [x] cross-user access rejection
  - [ ] validation failures (bad UUID, empty title, etc.)

**Optional (if we want a full demo)**
- [x] Replace `apps/frontend/web/app/pages/index.tsx` with a TODO UI using `useApi()` + React Query (create/list/update/delete)

### 6) GitHub publish polish (minimum viable “public” quality)

- [ ] Ensure no generated/temporary artifacts are committed (sanity-check `.gitignore`)
- [ ] Fix root `package.json` `engines` field + add missing scripts (`test`, `test:watch` if desired)
- [ ] Expand `.env.example` to include all required env vars for:
  - backend (`BASE_SERVICE_URL`, `CORS_ORIGINS`, auth vars)
  - frontend (`VITE_API_URL`, `VITE_AUTH_URL`)
- [ ] Add basic repo metadata:
  - [x] `LICENCE.md` (MIT)
  - [x] `CONTRIBUTING.md` (how to run, how to propose changes; include LLM responsibility note)
  - [ ] `CODE_OF_CONDUCT.md` (optional but common)
- [ ] Add GitHub Actions CI (typecheck + lint + test) for the monorepo (no build)
- [ ] Decide on naming:
  - [ ] keep `@yourcompany/*` as template placeholder vs rename to real scope
  - [ ] document how to rename safely if keeping as template

## License note

MIT is OSI-approved and maximizes reuse, but it **cannot** force contribution-back. If you want to encourage contributions, do it socially:

- Put a clear request in README (“if you use this, please link back / open PRs”).
- Use `CONTRIBUTING.md` to set expectations and make contributing easy.
