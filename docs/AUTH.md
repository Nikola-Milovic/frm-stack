# Auth (Better Auth)

## Purpose

Provide cookie-based auth for the frontend, and expose a typed user/session context to oRPC procedures.

## Where it lives

- App integration: `apps/backend/api/src/auth.ts`
- Backend core auth helpers: `packages/backend/core/src/auth.ts`
- Frontend providers: `apps/frontend/web/app/providers/*`

## How it works (this repo)

- Better Auth endpoints are registered under:
  - `GET/POST /api/auth/*`
- A middleware attaches session/user data onto the Hono context.
- oRPC context reads `c.get("user")` and `c.get("session")` in `apps/backend/api/src/orpc.ts`.

## Conventions

- Use `authOnly` middleware for protected oRPC procedures.
- Prefer reading the user id from `context.user.id` rather than trusting client-provided ids.

## Gotchas

- CORS must allow credentials, and frontend fetch must send cookies:
  - Backend: `hono/cors` with `credentials: true`
  - Frontend: oRPC client fetch uses `credentials: "include"`
