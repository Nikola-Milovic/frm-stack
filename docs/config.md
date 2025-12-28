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

### Vite Environment Files

Vite loads environment variables from multiple files in the following priority order (highest to lowest):

1. `.env.[mode].local` (e.g., `.env.development.local`) - Local overrides, **git-ignored**
2. `.env.[mode]` (e.g., `.env.development`, `.env.production`) - Mode-specific variables
3. `.env.local` - Local overrides for all modes, **git-ignored**
4. `.env` - Shared variables loaded in **all cases**

**Key points:**
- Variables defined in higher priority files override those in lower priority files
- `.local` files are git-ignored and used for local development secrets
- Only variables prefixed with `VITE_` are exposed to your client-side code
- The `mode` is typically `development` or `production` (set via `--mode` flag or defaults)

**Example setup:**
- `.env.example` - Template for shared variables (empty by default)
- `.env.development.example` - Template for development-specific variables
- Copy `.env.development.example` → `.env.development` for local dev

## Gotchas

- Keep `.env.[mode].example` files in sync with what `config.ts` actually requires.
- Avoid leaking secrets into frontend env (Vite exposes `VITE_*` to the browser).
- Remember that `.env` is loaded in **all modes**, so use it sparingly for truly shared config.
