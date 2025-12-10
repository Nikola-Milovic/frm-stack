# Logging (pino)

## Purpose

Structured logs that are easy to filter/ship later.

## Where it lives

- Logger: `apps/backend/api/src/log.ts` and `packages/backend/core/src/log.ts`

## Conventions

- Log structured context (ids, route names, inputs) rather than concatenated strings.
- Prefer `logger.error("message", err, { ...context })` for failures.

## Safety

- Do not log secrets (auth tokens, passwords, raw cookies).
- Be careful with request logging; this repo has an optional `REQUEST_LOGGING` flag in `apps/backend/api/src/orpc.ts`.
