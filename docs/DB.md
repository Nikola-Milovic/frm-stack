# Database (Postgres + Kysely + Atlas)

## Source of truth

- `db/schema.sql` is the canonical schema for this repo.

## Push first, migrations later (how I work)

In early development I usually use “push” a lot to iterate quickly (apply the schema directly), and once the shape stabilizes I switch to **versioned migrations**.

- Push (fast iteration): `just db-migrate`
- Versioned migrations (reviewable history): `just db-migration-new <name>` then `just db-migration-apply`

## Local dev workflow (this repo)

1) Start Postgres:
- `docker compose up -d` (or `just setup`)

2) Apply schema:
- `just db-migrate`

### Versioned migrations (Atlas)

Even with versioned migrations, `db/schema.sql` stays the source of truth for tables. Atlas uses it to infer changes and generate migration files.

- Create a new migration from schema diff:
  - `just db-migration-new add_todos`
- Apply migrations:
  - `just db-migration-apply`
- Check status:
  - `just db-migration-status`

3) Generate TypeScript DB types (optional but recommended after schema changes):
- `just db-schema`

This generates `packages/backend/core/src/schema.ts` via `kysely-codegen`.

## Runtime DB access

- DB connection + pool is in `packages/backend/core/src/db.ts`:
  - `connectDB(...)` once at app startup
  - `getDB()` anywhere after initialization

## Conventions

- Use `uuid` primary keys.
- Use `created_at` / `updated_at` on tables (mapped to camelCase in TypeScript via Kysely plugin).
- Enforce tenancy/ownership at the service layer (e.g. `todos.user_id`).

## Gotchas

- Tests apply `db/schema.sql` into a testcontainers Postgres instance.
- If you change schema, remember to:
  - update `db/schema.sql`
  - re-apply locally (`just db-migrate`)
  - re-generate TS types (`just db-schema`)
