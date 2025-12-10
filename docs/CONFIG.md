# Config (env + Zod)

## Purpose

Validate required environment variables at startup, with typed access in code.

## Where it lives

- Backend config: `apps/backend/api/src/config.ts`
- DB config schema: `packages/backend/core/src/config.ts`
- Frontend config: `apps/frontend/web/app/lib/config.ts`

## Backend pattern

- Define a Zod schema.
- Parse from `process.env` at module load (`appConfig`).

## Frontend pattern

- Read `import.meta.env.*` and validate once in `getConfig()`.

## Gotchas

- Keep `.env.example` in sync with what `config.ts` actually requires.
- Avoid leaking secrets into frontend env (Vite exposes `VITE_*` to the browser).
