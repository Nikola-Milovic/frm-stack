/**
 * Example test file demonstrating the shared database pattern
 *
 * This shows the recommended way to write tests using the shared database helper.
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { Kysely } from "kysely";
import type { DB as DatabaseSchema } from "#schema";
import { getSharedDatabaseHelper, resetSharedDatabase, createTestUser } from "#test-helpers";

describe("Example Test Suite", () => {
  let db: Kysely<DatabaseSchema>;

  // Setup: Initialize database connection once for this test suite
  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  }, 60000);

  // Reset: Clean database before each test for isolation
  beforeEach(async () => {
    await resetSharedDatabase();
  }, 30000);

  // No afterAll needed - global cleanup handles it

  it("should create a user successfully", async () => {
    const user = await createTestUser(db);

    expect(user).toBeDefined();
    expect(user.email).toContain("test-");
    expect(user.name).toBe("Test User");
  });

  it("should have clean database (no users from previous test)", async () => {
    // This test proves that resetSharedDatabase() works
    const users = await db.selectFrom("users").selectAll().execute();

    expect(users).toHaveLength(0);
  });

  it("should handle multiple users", async () => {
    const user1 = await createTestUser(db);
    const user2 = await createTestUser(db);

    const users = await db.selectFrom("users").selectAll().execute();

    expect(users).toHaveLength(2);
    expect(users.map((u) => u.id)).toContain(user1.id);
    expect(users.map((u) => u.id)).toContain(user2.id);
  });

  describe("Nested describe blocks", () => {
    // beforeEach from parent scope runs automatically

    it("should also have clean database", async () => {
      const users = await db.selectFrom("users").selectAll().execute();
      expect(users).toHaveLength(0);
    });
  });
});
