---
name: testing
description: Shared database testing patterns with testcontainers and Vitest. Use when writing backend tests, setting up test files, debugging test failures, or configuring Vitest. Triggers on "write tests", "test setup", "testcontainers", "vitest config", "test isolation", or when creating new test suites.
---

# Testing

This repo uses a **shared PostgreSQL container** with **TRUNCATE resets** for fast, isolated tests.

## Quick Start

```typescript
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { Kysely } from "kysely";
import type { DB as DatabaseSchema } from "#schema";
import { getSharedDatabaseHelper, resetSharedDatabase, createTestUser } from "#test-helpers";

describe("My Test Suite", () => {
  let db: Kysely<DatabaseSchema>;

  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  beforeEach(async () => {
    await resetSharedDatabase();
  });

  it("should work", async () => {
    const user = await createTestUser(db);
    expect(user).toBeDefined();
  });
});
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `getSharedDatabaseHelper()` | Get DB connection (call in `beforeAll`) |
| `resetSharedDatabase()` | Reset to clean state (call in `beforeEach`) |
| `createTestUser(db)` | Create test user fixture |

## Vitest Config Requirements

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: "threads",      // REQUIRED: threads, not forks
    maxConcurrency: 4,    // Limit parallel tests
    isolate: false,       // Reuse context for speed
    hookTimeout: 120000,  // 2 min for container startup
    testTimeout: 30000,   // 30 sec per test
  }
});
```

Use `createSharedTestConfig()` from `@yourcompany/backend-core/vitest.config.shared`:

```typescript
import { mergeConfig, defineConfig } from "vitest/config";
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

export default mergeConfig(
  createSharedTestConfig({ setupFiles: ["./src/test-setup.ts"] }),
  defineConfig({ /* overrides */ })
);
```

## Common Patterns

### Shared Test Data

```typescript
let testUser: User;

beforeEach(async () => {
  await resetSharedDatabase();
  testUser = await createTestUser(db); // Create AFTER reset
});
```

### Nested Describes

```typescript
describe("Feature", () => {
  beforeEach(async () => {
    await resetSharedDatabase(); // Applies to ALL nested tests
  });

  describe("sub-feature", () => {
    it("test 1", () => { /* clean DB */ });
    it("test 2", () => { /* clean DB */ });
  });
});
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Database not initialized" | Test ran before setup | Add `beforeAll` with `getSharedDatabaseHelper()` |
| Tests interfering | Missing reset | Add `resetSharedDatabase()` in `beforeEach` |
| Connection refused | Timeout too short | Increase `hookTimeout` |
| Slow suite | Check logs | Should see only ONE container startup |

## Rules

- Use `pool: "threads"` (not `forks`)
- Always call `resetSharedDatabase()` in `beforeEach`
- No `afterAll` cleanup needed - handled globally
- Use DI in app code to enable test fakes

## Storybook (UI Testing)

```bash
pnpm --filter @yourcompany/web storybook
```

Ensure `VITE_API_URL` and `VITE_AUTH_URL` are set in `.env.development`.
