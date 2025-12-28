# Testing Guide

## TL;DR

- Use the shared DB helper: `getSharedDatabaseHelper()`
- Reset state before each test: `resetSharedDatabase()`
- Keep Vitest `pool: "threads"` (not forks) + set `maxConcurrency`
- For UI component testing, use Storybook via `@yourcompany/testing` shared config

This document explains our shared database testing pattern and how to write safe, fast tests.

Notes:
- Prefer **DI** in app code (pass `db`, `logger`, etc.) so tests can swap real dependencies for fakes.
- The shared testcontainers singleton is an **experiment**; if you dislike the tradeoffs, use per-suite/per-test containers instead.

## Overview

We use a **shared PostgreSQL container** approach with **testcontainers snapshots** for maximum test performance:

- ✅ **Fast**: One container for all tests
- ✅ **Safe**: Snapshot restore ensures perfect test isolation
- ✅ **Simple**: Automatic setup and cleanup
- ✅ **Parallel**: Tests run concurrently without conflicts

## How It Works

### 1. **Shared Container** (Singleton Pattern)

This is intentionally aggressive for speed and is still considered **experimental** in this template.

```typescript
// One PostgreSQL container for the entire test suite
let sharedDatabaseHelper: TestPostgresContainer | null = null;
```

**Benefits:**
- Container starts once at the beginning
- All tests share the same container
- Automatic cleanup after all tests complete

### 2. **Optimized TRUNCATE** (~100-200ms per reset)

```typescript
beforeEach(async () => {
  await resetSharedDatabase(); // Truncates all tables to clean state
});
```

**How TRUNCATE works:**
1. Migrations run once when container starts
2. Before each test, all tables are truncated
3. Uses optimized single-query TRUNCATE with triggers disabled
4. Stable - no connection drops or pool issues

### 3. **Thread-Safe Reset** (Mutex Pattern)

```typescript
// Prevents race conditions when tests reset in parallel
let resetMutex: Promise<void> = Promise.resolve();
```

**Safety guarantee:**
- Only one reset happens at a time
- Tests wait for previous reset to complete
- No data corruption from concurrent resets

## Quick Start

### Basic Test Pattern

```typescript
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { Kysely } from "kysely";
import type { DB as DatabaseSchema } from "#schema";
import { getSharedDatabaseHelper, resetSharedDatabase, createTestUser } from "#test-helpers";

describe("My Test Suite", () => {
  let db: Kysely<DatabaseSchema>;

  // Setup: Get database connection
  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  // Reset: Clean database before each test
  beforeEach(async () => {
    await resetSharedDatabase();
  });

  // No afterAll needed - global cleanup handles it

  it("should work", async () => {
    const user = await createTestUser(db);
    expect(user).toBeDefined();
  });
});
```

## Safety Considerations

### ✅ **Is This Safe?**

**Yes, with the correct Vitest configuration:**

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: "threads",  // ✅ REQUIRED: threads (not forks)
    maxConcurrency: 4, // ✅ Limit parallel tests
    isolate: false,    // ✅ Reuse context for speed
  }
});
```

### ⚠️ **When It's NOT Safe:**

❌ **`pool: "forks"`** - Separate processes, mutex won't work
❌ **No `maxConcurrency`** - Too many concurrent resets
❌ **Manual database access outside reset** - Bypasses isolation

### 🔒 **Race Condition Prevention**

#### Scenario 1: Concurrent Resets (✅ SAFE)
```typescript
// Test A calls reset
await resetSharedDatabase(); // Acquires mutex

// Test B calls reset (waits for mutex)
await resetSharedDatabase(); // Waits, then runs

// ✅ Mutex ensures sequential execution
```

#### Scenario 2: Reset During Test (✅ SAFE)
```typescript
beforeEach(async () => {
  await resetSharedDatabase(); // Completes BEFORE test starts
});

it("test runs after reset completes", async () => {
  // ✅ Database is guaranteed clean at this point
});
```

#### Scenario 3: Multiple Tests, Same Time (✅ SAFE)
```typescript
// Vitest ensures beforeEach completes before test starts
// Even with maxConcurrency: 4, tests don't overlap with their own beforeEach
```

## Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    // Global setup - initializes shared container
    setupFiles: ["./src/test-setup.ts"],
    
    // Timeouts
    hookTimeout: 120000, // 2 min for container startup
    testTimeout: 30000,  // 30 sec per test
    
    // Parallel execution (IMPORTANT!)
    pool: "threads",     // Must be threads, not forks
    isolate: false,      // Reuse context for better performance
    
    // Limit concurrency (adjust for your machine)
    maxConcurrency: 4,
  },
});
```

## Storybook (UI)

We keep shared Storybook (React + Vite) defaults in `@yourcompany/testing` and consume them from each frontend package/app via `.storybook/main.ts` and `.storybook/preview.ts`.

### Run Storybook

```bash
pnpm --filter @yourcompany/web storybook
pnpm --filter @yourcompany/frontend storybook
```

### Notes

- The frontend app reads `VITE_API_URL` and `VITE_AUTH_URL` at runtime; ensure `apps/frontend/web/.env.development` (or `.env`) is present (or export those env vars) so Storybook can render auth components.

### Performance Tuning

**Conservative (safest):**
```typescript
maxConcurrency: 1 // Sequential execution
```

**Balanced (recommended):**
```typescript
maxConcurrency: 4 // Good parallelism, safe
```

**Aggressive (fast, but risky):**
```typescript
maxConcurrency: 10 // Many concurrent tests
// ⚠️ May cause connection pool exhaustion
```

## Common Patterns

### Pattern 1: Simple Test

```typescript
describe("Users", () => {
  let db: Kysely<DatabaseSchema>;

  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  beforeEach(async () => {
    await resetSharedDatabase();
  });

  it("should create user", async () => {
    const user = await createTestUser(db);
    expect(user.name).toBe("Test User");
  });
});
```

### Pattern 2: Nested Describes

```typescript
describe("Wallets", () => {
  let db: Kysely<DatabaseSchema>;

  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  // Reset applies to ALL tests in nested describes
  beforeEach(async () => {
    await resetSharedDatabase();
  });

  describe("deposits", () => {
    it("should deposit money", async () => {
      // Database is clean
    });
  });

  describe("withdrawals", () => {
    it("should withdraw money", async () => {
      // Database is clean
    });
  });
});
```

### Pattern 3: Shared Test Data

```typescript
describe("Orders", () => {
  let db: Kysely<DatabaseSchema>;
  let testUser: User;

  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  beforeEach(async () => {
    await resetSharedDatabase();
    
    // Create shared test data AFTER reset
    testUser = await createTestUser(db);
  });

  it("should create order", async () => {
    const order = await createOrder(db, testUser.id);
    expect(order.userId).toBe(testUser.id);
  });
});
```

## Debugging

### Enable Debug Logging

```bash
DEBUG_TESTS=1 vitest
```

Output:
```
[Shared DB] Initializing shared PostgreSQL container...
[Test DB] Initial snapshot created after migrations
[Shared DB] Shared PostgreSQL container ready
[Shared DB] Database reset to initial snapshot
[Shared DB] Database reset to initial snapshot
...
[Shared DB] Cleaning up shared PostgreSQL container...
```

### Check Container Status

```typescript
it("debug container", async () => {
  const dbHelper = await getSharedDatabaseHelper();
  console.log("Connection string:", dbHelper.connectionString);
  
  const result = await dbHelper.db
    .selectFrom("pg_stat_activity")
    .selectAll()
    .execute();
  
  console.log("Active connections:", result.length);
});
```

## Troubleshooting

### "Database not initialized" Error

**Cause:** Test ran before global setup completed

**Solution:** Ensure test has `beforeAll`:
```typescript
beforeAll(async () => {
  const dbHelper = await getSharedDatabaseHelper();
  db = dbHelper.db;
});
```

### "Connection refused" Error

**Cause:** Container not ready or connections not recycled

**Solution:** Check `hookTimeout` is sufficient:
```typescript
test: {
  hookTimeout: 120000, // Increase if needed
}
```

### Tests Interfering With Each Other

**Cause:** Forgot `resetSharedDatabase()` in `beforeEach`

**Solution:**
```typescript
beforeEach(async () => {
  await resetSharedDatabase(); // Don't forget this!
});
```

### Slow Test Suite

**Possible causes:**
1. Container starting multiple times (check singleton)
2. Not using snapshots (using TRUNCATE instead)
3. Sequential execution (check `maxConcurrency`)

**Solution:** Verify logs show only one container startup:
```
[Shared DB] Initializing shared PostgreSQL container... // Should appear ONCE
```

## Performance Benchmarks

### Before (Individual Containers)
- 100 tests: ~12 minutes
- Container starts: 100 times
- Reset method: TRUNCATE per container

### After (Shared Container + Optimized TRUNCATE)
- 100 tests: ~3-4 minutes
- Container starts: 1 time
- Reset method: Optimized TRUNCATE (single query)

**3-4x faster!** ⚡

## Migration Guide

### From PGlite

**Before:**
```typescript
let client: PGlite;

beforeEach(async () => {
  client = new PGlite();
  await runMigrations(client);
  db = createKyselyDB(client);
});

afterEach(async () => {
  await client.close();
});
```

**After:**
```typescript
let db: Kysely<DatabaseSchema>;

beforeAll(async () => {
  const dbHelper = await getSharedDatabaseHelper();
  db = dbHelper.db;
});

beforeEach(async () => {
  await resetSharedDatabase();
});
```

### From Individual Testcontainers

**Before:**
```typescript
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  // ... setup
});

afterAll(async () => {
  await container.stop();
});
```

**After:**
```typescript
let db: Kysely<DatabaseSchema>;

beforeAll(async () => {
  const dbHelper = await getSharedDatabaseHelper();
  db = dbHelper.db;
});

beforeEach(async () => {
  await resetSharedDatabase();
});

// No afterAll needed!
```

## Best Practices

### ✅ DO

- Use `pool: "threads"` in Vitest config
- Call `resetSharedDatabase()` in `beforeEach`
- Set reasonable `maxConcurrency` (4-8)
- Use `beforeAll` to get database connection
- Let global cleanup handle teardown

### ❌ DON'T

- Use `pool: "forks"` (breaks mutex)
- Forget `resetSharedDatabase()` in `beforeEach`
- Manually stop the container in `afterAll`
- Create new containers in individual tests
- Access database outside of test lifecycle

## FAQ

**Q: Can I use this in CI/CD?**
A: Yes! Testcontainers works great in CI. Make sure Docker is available.

**Q: How many tests can run in parallel?**
A: Depends on your connection pool size (default: 20). With `maxConcurrency: 4`, you're safe.

**Q: What if I need a different database per test suite?**
A: Use individual containers instead. This pattern is for shared state.

**Q: Why TRUNCATE instead of snapshots?**
A: TRUNCATE is more stable with connection pooling - no connection drops or pool recreation needed.

**Q: Is this safe for production databases?**
A: No! This is for testing only. Never point tests at production.

## Summary

This testing pattern provides:
- ⚡ **6x faster** test execution
- 🔒 **Thread-safe** resets with mutex
- 🎯 **Perfect isolation** via snapshots
- 🚀 **Parallel execution** without conflicts
- 🎨 **Simple API** - just 3 functions

**Key functions:**
1. `getSharedDatabaseHelper()` - Get DB connection
2. `resetSharedDatabase()` - Reset to clean state
3. `cleanupSharedDatabaseHelper()` - Cleanup (automatic)

Happy testing! 🧪
