import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from "kysely";
import type { DB as DatabaseSchema } from "#schema";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { existsSync } from "node:fs";
import type { DB } from "#db";

export function findSchemaDir(): string {
  let currentDirPath = __dirname;

  while (currentDirPath !== dirname(currentDirPath)) {
    const workspaceFile = join(currentDirPath, "pnpm-workspace.yaml");
    if (existsSync(workspaceFile)) {
      return join(currentDirPath, "db/schema.sql");
    }
    currentDirPath = dirname(currentDirPath);
  }

  throw new Error("Project root not found");
}

export interface TestPostgresContainer {
  container: StartedPostgreSqlContainer;
  connectionString: string;
  pool: Pool;
  db: DB;
  cleanup: () => Promise<void>;
}

export async function createTestPostgresContainer(): Promise<TestPostgresContainer> {
  const container = await new PostgreSqlContainer("postgres:18")
    .withDatabase("testdb")
    .withUsername("test")
    .withPassword("test")
    .start();

  const connectionString = container.getConnectionUri();

  // Run migrations
  await runMigrations(connectionString);

  if (process.env.DEBUG_TESTS) {
    console.log("[Test DB] PostgreSQL container ready with migrations");
  }

  // Create the connection pool
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Create Kysely instance
  const db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool }),
    plugins: [new CamelCasePlugin()],
  });

  const cleanup = async () => {
    await pool.end();
    await container.stop();
  };

  return {
    container,
    connectionString,
    pool,
    db,
    cleanup,
  };
}

async function runMigrations(connectionString: string) {
  const client = new Client({ connectionString });
  await client.connect();

  const schemaDir = findSchemaDir();

  try {
    const schema = readFileSync(schemaDir, "utf-8");
    await client.query(schema);
  } finally {
    await client.end();
  }
}

export async function createTestUser(db: DB) {
  const userId = randomUUID();

  const [user] = await db
    .insertInto("users")
    .values({
      id: userId,
      name: "Test User",
      emailVerified: false,
      email: `test-${userId}@example.com`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returningAll()
    .execute();

  if (!user) {
    throw new Error("Failed to create test user");
  }

  return user;
}

/**
 * Resets the entire database by dropping the public schema and recreating it
 * This is useful for test isolation when manual table cleanup becomes complex
 * @deprecated Use resetSharedDatabase() with snapshots instead (much faster)
 */
export async function resetDatabase(db: Kysely<DatabaseSchema>, connectionString: string): Promise<void> {
  try {
    // Drop and recreate the public schema (this removes all tables, functions, etc.)
    await sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.execute(db);

    // Re-run migrations to recreate all tables
    await runMigrations(connectionString);
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}

// ============================================================================
// SHARED DATABASE PATTERN (Recommended for fast test suites)
// ============================================================================

/**
 * Global shared database helper for all tests
 *
 * This singleton ensures that all tests share a single PostgreSQL container,
 * dramatically reducing test execution time (from ~10+ minutes to ~2-3 minutes).
 *
 * Usage:
 * ```typescript
 * import { getSharedDatabaseHelper, resetSharedDatabase } from "@yourcompany/backend-core/test-helpers";
 *
 * beforeAll(async () => {
 *   const dbHelper = await getSharedDatabaseHelper();
 *   db = dbHelper.db;
 * });
 *
 * beforeEach(async () => {
 *   await resetSharedDatabase();
 * });
 * ```
 */

let sharedDatabaseHelper: TestPostgresContainer | null = null;
let setupPromise: Promise<TestPostgresContainer> | null = null;

/**
 * Gets or creates the shared database helper instance
 * This ensures all tests use the same PostgreSQL container
 */
export async function getSharedDatabaseHelper(): Promise<TestPostgresContainer> {
  // If already set up, return immediately
  if (sharedDatabaseHelper) {
    return sharedDatabaseHelper;
  }

  // If setup is in progress, wait for it
  if (setupPromise) {
    return await setupPromise;
  }

  // Start setup
  setupPromise = (async () => {
    if (process.env.DEBUG_TESTS) {
      console.log("[Shared DB] Initializing shared PostgreSQL container...");
    }

    sharedDatabaseHelper = await createTestPostgresContainer();

    if (process.env.DEBUG_TESTS) {
      console.log("[Shared DB] Shared PostgreSQL container ready");
    }

    return sharedDatabaseHelper;
  })();

  return await setupPromise;
}

/**
 * Cleans up the shared database helper
 * Should be called in global afterAll hook
 */
export async function cleanupSharedDatabaseHelper(): Promise<void> {
  if (sharedDatabaseHelper) {
    if (process.env.DEBUG_TESTS) {
      console.log("[Shared DB] Cleaning up shared PostgreSQL container...");
    }

    await sharedDatabaseHelper.cleanup();
    sharedDatabaseHelper = null;
    setupPromise = null;

    if (process.env.DEBUG_TESTS) {
      console.log("[Shared DB] Shared PostgreSQL container cleaned up");
    }
  }
}

/**
 * Resets the shared database to clean state using optimized TRUNCATE
 *
 * Thread-safe: Uses mutex to prevent race conditions when multiple tests
 * reset the database in parallel
 *
 * How it works:
 * 1. Disables triggers for faster execution
 * 2. Truncates all tables at once with RESTART IDENTITY CASCADE
 * 3. Re-enables triggers
 *
 *
 * @throws Error if shared database helper is not initialized
 */

// Mutex for thread-safe reset operations
let resetMutex: Promise<void> = Promise.resolve();

export async function resetSharedDatabase(): Promise<void> {
  if (!sharedDatabaseHelper) {
    throw new Error("Shared database helper not initialized. Call getSharedDatabaseHelper() first.");
  }

  // Thread-safe reset: waits for previous reset to complete before starting new one
  // This prevents race conditions when multiple tests reset the database in parallel
  let releaseMutex: () => void = () => {
    // No-op initializer to satisfy TypeScript's definite assignment check
  };
  const resetPromise = new Promise<void>((resolve) => {
    releaseMutex = resolve;
  });

  const previousReset = resetMutex;
  resetMutex = previousReset.then(() => resetPromise);

  await previousReset;

  try {
    // Optimized TRUNCATE - uses single SQL query instead of loop
    // RESTART IDENTITY resets sequences, CASCADE deletes all dependent data
    // Disable/enable triggers for faster execution
    await sharedDatabaseHelper.db.executeQuery(
      sql`
        DO $$
        DECLARE
          table_list TEXT;
        BEGIN
          -- Disable triggers for faster execution
          SET session_replication_role = 'replica';

          -- Collect all tables into one string (faster than loop)
          SELECT string_agg(quote_ident(tablename), ', ')
          INTO table_list
          FROM pg_tables
          WHERE schemaname = 'public';

          -- Truncate all tables at once with RESTART IDENTITY (faster)
          -- CASCADE automatically handles foreign key dependencies
          IF table_list IS NOT NULL THEN
            EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE';
          END IF;

          -- Re-enable triggers
          SET session_replication_role = 'origin';
        END $$;
      `.compile(sharedDatabaseHelper.db),
    );

    if (process.env.DEBUG_TESTS) {
      console.log("[Shared DB] Database reset via TRUNCATE");
    }

    releaseMutex();
  } catch (error) {
    releaseMutex();
    console.error("Failed to reset database:", error);
    throw error;
  }
}
