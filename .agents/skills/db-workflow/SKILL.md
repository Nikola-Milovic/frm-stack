---
name: db-workflow
description: Database workflow with Postgres, Kysely, and Atlas migrations. Use when modifying database schema, creating migrations, generating TypeScript types, or troubleshooting database issues. Triggers on "schema change", "migration", "db-migrate", "kysely", "atlas", or when editing db/schema.sql.
---

# Database Workflow

**Source of truth:** `db/schema.sql` is the canonical schema.

## Quick Commands

| Command | Purpose |
|---------|---------|
| `just db-migrate` | Apply schema directly (fast iteration) |
| `just db-migration-new <name>` | Create versioned migration |
| `just db-migration-apply` | Apply versioned migrations |
| `just db-migration-status` | Check migration status |
| `just db-schema` | Generate TypeScript types |

## Workflow Decision Tree

```
Schema change needed?
├─ Early development / experimenting
│  └─ Edit db/schema.sql → just db-migrate → just db-schema
│
└─ Production / reviewable history needed
   └─ Edit db/schema.sql → just db-migration-new <name> → just db-migration-apply → just db-schema
```

## Local Dev Setup

```bash
# 1. Start Postgres
docker compose up -d  # or: just setup

# 2. Apply schema
just db-migrate

# 3. Generate TypeScript types (after schema changes)
just db-schema
```

## Schema Changes Checklist

1. Edit `db/schema.sql`
2. Apply locally: `just db-migrate`
3. Generate types: `just db-schema`
4. Update any affected services/routers
5. Run tests: `pnpm test`

## Versioned Migrations (Atlas)

Even with versioned migrations, `db/schema.sql` stays the source of truth. Atlas uses it to infer changes.

```bash
# Create migration from schema diff
just db-migration-new add_user_roles

# Apply migrations
just db-migration-apply

# Check status
just db-migration-status
```

## Conventions

- Use `uuid` primary keys
- Use `created_at` / `updated_at` timestamps
- Enforce tenancy at service layer (e.g., `todos.user_id`)
- Columns mapped to camelCase in TypeScript via Kysely plugin

## Runtime DB Access

```typescript
// packages/backend/core/src/db.ts
import { connectDB, getDB } from "@yourcompany/backend-core/db";

// At app startup (once)
await connectDB({ connectionString: config.DATABASE_URL });

// Anywhere after initialization
const db = getDB();
const users = await db.selectFrom("user").selectAll().execute();
```

## Why Kysely (vs Drizzle/Prisma)

- **Typed query builder** without ORM "model" layer
- Works with **SQL-first** workflow (`db/schema.sql`) + codegen
- Easy to pass `db` dependency for testing

## Gotchas

- Tests apply `db/schema.sql` into testcontainers Postgres
- After schema changes:
  - Update `db/schema.sql`
  - Re-apply locally (`just db-migrate`)
  - Re-generate TS types (`just db-schema`)
- Generated types: `packages/backend/core/src/schema.ts`
