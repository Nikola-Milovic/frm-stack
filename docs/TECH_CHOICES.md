# Tech choices (why these tools?)

This repo is a **demo**. These are *current* choices, optimized for *this* template’s goals (fast DX, type-safety, explicit errors, and testability). You should absolutely swap pieces out for whatever your team prefers.

## DB: Kysely (vs Drizzle/Prisma/etc.)

Why Kysely here:
- **Typed query builder** without committing to an ORM “model” layer.
- Plays nicely with a **SQL-first** workflow (`db/schema.sql`) + deterministic schema application.
- Easy to keep DB usage **explicit** in services and pass a `db` dependency for testing.

Why not Drizzle (for this repo):
- Drizzle is great, but this template is intentionally **SQL-first** (Atlas + `db/schema.sql`) and uses codegen for TS schema types; Kysely fits that workflow cleanly.

Why not Prisma (for this repo):
- Prisma is productive, but adds a heavier abstraction/runtime and encourages a different “Prisma schema as source-of-truth” workflow than this repo.

## RPC: oRPC (vs tRPC/etc.)

Why oRPC here:
- **End-to-end typed RPC** with a lightweight HTTP story and React Query helpers.
- Keeps API boundaries explicit while still being “single language” TypeScript.
- Works cleanly with Hono and a services-first layout.

Why not tRPC (for this repo):
- tRPC is a solid, popular choice; oRPC's ergonomics and integration fit the "minimal server glue + contract-first" feel I wanted for this template.

## Routing: TanStack Router

Why TanStack Router here:
- **Type-safe, file-based routing** with excellent DX and developer tools.
- Strong TypeScript integration and thoughtful API design.
- Part of the broader TanStack ecosystem (see below).

## TanStack libraries: preferred when available

This repo prefers **TanStack libraries** (TanStack Router, TanStack Query, etc.) when they fit the use case. The TanStack team consistently delivers:
- **Well-thought-out APIs** with excellent TypeScript support
- **Great developer experience** and tooling
- **Strong community support** and active maintenance

## Errors: neverthrow

Why neverthrow here:
- Encourages **explicit** success/failure flows (no “hidden” exceptions across layers).
- Makes error mapping (service → router → client) intentional.

## Auth: Better Auth

Why Better Auth here:
- **Free and open source**.
- Good feature coverage for a template that wants “batteries included” auth without a huge amount of glue code.

Tradeoffs:
- It has some **rough edges**, and there have been **breaking changes** in non-major versions that ideally shouldn’t happen.
- Still: overall it’s great tech, and it’s easy to swap out if your team prefers something else.

## Dependency injection (DI): prefer it

This repo generally prefers **constructor/function injection** (e.g. `new TodoService(db, logger)`) because it:
- makes testing easier (swap real DB/logger for fakes)
- reduces global state and hidden coupling

## Testing: shared testcontainers Postgres (experimental)

The “single shared Postgres container + TRUNCATE reset” pattern is chosen for speed, but it’s an **experiment**. If it causes flakiness or confusion, we’ll revisit it (including switching to per-suite/per-test containers).
