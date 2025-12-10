import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { UserNotAuthorizedError, UserService } from "#services/user";
import type { DB } from "@yourcompany/backend-core/db";
import type { Logger } from "@yourcompany/backend-core/log";
import { createTestUser } from "@yourcompany/backend-core/test-helpers";
import { getSharedDatabaseHelper, resetSharedDatabase } from "@yourcompany/backend-core/test-helpers";
import { randomUUID } from "node:crypto";

describe("UserService", () => {
  let db: DB;
  let service: UserService;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  // Mock logger
  const mockLogger: Logger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeAll(async () => {
    const dbHelper = await getSharedDatabaseHelper();
    db = dbHelper.db;
  });

  beforeEach(async () => {
    await resetSharedDatabase();

    // Create test user after reset
    testUser = await createTestUser(db);

    // Initialize service
    service = new UserService(db, mockLogger);
  });

  describe("getUserById", () => {
    it("should retrieve an existing user by ID", async () => {
      const result = await service.getUserById({ id: testUser.id, userId: testUser.id });

      expect(result.isOk()).toBe(true);
      if (result.isErr()) throw result.error;

      expect(result.value.id).toBe(testUser.id);
      expect(result.value.name).toBe(testUser.name);
      expect(result.value.email).toBe(testUser.email);
    });

    it("should return error for non-existent user", async () => {
      const nonExistentId = randomUUID();
      const result = await service.getUserById({ id: nonExistentId, userId: testUser.id });

      expect(result.isErr()).toBe(true);
      if (result.isOk()) throw new Error("Expected error for non-existent user");
      expect(result.error).toBeInstanceOf(Error);
      // Kysely throws an error when executeTakeFirstOrThrow finds no row
      // The error message typically contains "no result" or similar
      expect(result.error.message.length).toBeGreaterThan(0);
    });

    it("should return validation error for invalid UUID", async () => {
      const result = await service.getUserById({ id: "invalid-uuid", userId: testUser.id });

      expect(result.isErr()).toBe(true);
      if (result.isOk()) throw new Error("Expected validation error");
      expect(result.error.message).toContain("Invalid UUID");
    });

    it("should return error for unauthorized user", async () => {
      const result = await service.getUserById({ id: testUser.id, userId: randomUUID() });

      expect(result.isErr()).toBe(true);
      if (result.isOk()) throw new Error("Expected error for unauthorized user");
      expect(result.error).toBeInstanceOf(UserNotAuthorizedError);
      expect(result.error.message).toBe("User not authorized");
    });
  });

  describe("onUserCreated", () => {
    it("should handle user created event successfully", async () => {
      const result = await UserService.onUserCreated(db, mockLogger, {
        userId: testUser.id,
      });

      expect(result.isOk()).toBe(true);
      if (result.isErr()) throw result.error;

      expect(result.value.message).toBe("User created successfully");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "On user created",
        expect.objectContaining({
          userId: testUser.id,
        }),
      );
    });

    it("should return error for non-existent user", async () => {
      const nonExistentId = randomUUID();
      const result = await UserService.onUserCreated(db, mockLogger, {
        userId: nonExistentId,
      });

      expect(result.isErr()).toBe(true);
      if (result.isOk()) throw new Error("Expected error for non-existent user");
      expect(result.error).toBeInstanceOf(Error);
      // Kysely throws an error when executeTakeFirstOrThrow finds no row
      // The error message typically contains "no result" or similar
      expect(result.error.message.length).toBeGreaterThan(0);
    });

    it("should return validation error for invalid UUID", async () => {
      const result = await UserService.onUserCreated(db, mockLogger, {
        userId: "invalid-uuid",
      });

      expect(result.isErr()).toBe(true);
      if (result.isOk()) throw new Error("Expected validation error");
      expect(result.error.message).toContain("Invalid UUID");
    });
  });
});
