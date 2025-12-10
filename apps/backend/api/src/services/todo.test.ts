import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import type { DB } from "@yourcompany/backend-core/db";
import type { Logger } from "@yourcompany/backend-core/log";
import { createTestUser, getSharedDatabaseHelper, resetSharedDatabase } from "@yourcompany/backend-core/test-helpers";
import { randomUUID } from "node:crypto";
import { TodoNotAuthorizedError, TodoNotFoundError, TodoService } from "#services/todo";

describe("TodoService", () => {
  let db: DB;
  let service: TodoService;
  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;

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
    userA = await createTestUser(db);
    userB = await createTestUser(db);
    service = new TodoService(db, mockLogger);
  });

  it("creates and lists todos", async () => {
    const created = await service.createTodo({ userId: userA.id, title: "First" });
    expect(created.isOk()).toBe(true);
    if (created.isErr()) throw created.error;

    const list = await service.listTodos({ userId: userA.id });
    expect(list.isOk()).toBe(true);
    if (list.isErr()) throw list.error;

    expect(list.value.length).toBe(1);
    expect(list.value[0]?.id).toBe(created.value.id);
    expect(list.value[0]?.completed).toBe(false);
  });

  it("updates todo title and completed", async () => {
    const created = await service.createTodo({ userId: userA.id, title: "Initial" });
    if (created.isErr()) throw created.error;

    const updated = await service.updateTodo({
      userId: userA.id,
      id: created.value.id,
      title: "Updated",
      completed: true,
    });
    expect(updated.isOk()).toBe(true);
    if (updated.isErr()) throw updated.error;

    expect(updated.value.title).toBe("Updated");
    expect(updated.value.completed).toBe(true);
  });

  it("deletes todo", async () => {
    const created = await service.createTodo({ userId: userA.id, title: "To delete" });
    if (created.isErr()) throw created.error;

    const deleted = await service.deleteTodo({ userId: userA.id, id: created.value.id });
    expect(deleted.isOk()).toBe(true);

    const after = await service.getTodoById({ userId: userA.id, id: created.value.id });
    expect(after.isErr()).toBe(true);
    if (after.isOk()) throw new Error("Expected not found");
    expect(after.error).toBeInstanceOf(TodoNotFoundError);
  });

  it("rejects cross-user access", async () => {
    const created = await service.createTodo({ userId: userA.id, title: "Private" });
    if (created.isErr()) throw created.error;

    const readOther = await service.getTodoById({ userId: userB.id, id: created.value.id });
    expect(readOther.isErr()).toBe(true);
    if (readOther.isOk()) throw new Error("Expected error");
    expect(readOther.error).toBeInstanceOf(TodoNotAuthorizedError);
  });

  it("returns not found for missing todo", async () => {
    const result = await service.getTodoById({ userId: userA.id, id: randomUUID() });
    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("Expected error");
    expect(result.error).toBeInstanceOf(TodoNotFoundError);
  });
});
