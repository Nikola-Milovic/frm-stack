import { type Result, err, fromAsyncThrowable } from "neverthrow";
import { z } from "zod";
import type { DB } from "@yourcompany/backend-core/db";
import type { Logger } from "@yourcompany/backend-core/log";
import type { Todo } from "@yourcompany/backend-core/types";
import { typedError, validateInput } from "@yourcompany/backend-core/validation";

export const createTodoSchema = z.object({
  userId: z.uuid(),
  title: z.string().trim().min(1).max(200),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type CreateTodoResult = Result<Todo, Error>;

export const listTodosSchema = z.object({
  userId: z.uuid(),
  completed: z.boolean().optional(),
});
export type ListTodosInput = z.infer<typeof listTodosSchema>;
export type ListTodosResult = Result<Todo[], Error>;

export const updateTodoSchema = z.object({
  userId: z.uuid(),
  id: z.uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type UpdateTodoResult = Result<Todo, Error>;

export const deleteTodoSchema = z.object({
  userId: z.uuid(),
  id: z.uuid(),
});
export type DeleteTodoInput = z.infer<typeof deleteTodoSchema>;
export type DeleteTodoResult = Result<{ deleted: true }, Error>;

export const getTodoByIdSchema = z.object({
  userId: z.uuid(),
  id: z.uuid(),
});
export type GetTodoByIdInput = z.infer<typeof getTodoByIdSchema>;
export type GetTodoByIdResult = Result<Todo, Error>;

export class TodoNotFoundError extends Error {
  constructor(message: string = "Todo not found") {
    super(message);
    this.name = "TodoNotFoundError";
  }
}

export class TodoNotAuthorizedError extends Error {
  constructor(message: string = "Todo not authorized") {
    super(message);
    this.name = "TodoNotAuthorizedError";
  }
}

export class TodoService {
  private readonly db: DB;
  private readonly logger: Logger;
  constructor(db: DB, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  async createTodo(input: CreateTodoInput): Promise<CreateTodoResult> {
    const validated = validateInput(createTodoSchema, input);
    if (validated.isErr()) return err(validated.error);

    return await fromAsyncThrowable(
      async () => {
        const now = new Date();
        const [todo] = await this.db
          .insertInto("todos")
          .values({
            userId: validated.value.userId,
            title: validated.value.title,
            completed: false,
            createdAt: now,
            updatedAt: now,
          })
          .returningAll()
          .execute();

        if (!todo) {
          throw new Error("Failed to create todo");
        }

        this.logger.info("Todo created", { todo });

        return todo;
      },
      (e) => typedError(e),
    )();
  }

  async listTodos(input: ListTodosInput): Promise<ListTodosResult> {
    const validated = validateInput(listTodosSchema, input);
    if (validated.isErr()) return err(validated.error);

    return await fromAsyncThrowable(
      async () => {
        let query = this.db.selectFrom("todos").where("userId", "=", validated.value.userId);
        if (typeof validated.value.completed === "boolean") {
          query = query.where("completed", "=", validated.value.completed);
        }

        const todos = await query.selectAll().orderBy("createdAt", "desc").execute();
        return todos;
      },
      (e) => typedError(e),
    )();
  }

  async getTodoById(input: GetTodoByIdInput): Promise<GetTodoByIdResult> {
    const validated = validateInput(getTodoByIdSchema, input);
    if (validated.isErr()) return err(validated.error);

    return await fromAsyncThrowable(
      async () => {
        const todo = await this.db
          .selectFrom("todos")
          .where("id", "=", validated.value.id)
          .selectAll()
          .executeTakeFirst();

        if (!todo) {
          throw new TodoNotFoundError();
        }

        if (todo.userId !== validated.value.userId) {
          throw new TodoNotAuthorizedError();
        }

        return todo;
      },
      (e) => typedError(e),
    )();
  }

  async updateTodo(input: UpdateTodoInput): Promise<UpdateTodoResult> {
    const validated = validateInput(updateTodoSchema, input);
    if (validated.isErr()) return err(validated.error);

    if (validated.value.title === undefined && validated.value.completed === undefined) {
      return err(new Error("Nothing to update"));
    }

    const existing = await this.getTodoById({ id: validated.value.id, userId: validated.value.userId });
    if (existing.isErr()) return err(existing.error);

    return await fromAsyncThrowable(
      async () => {
        const patch: { title?: string; completed?: boolean; updatedAt: Date } = {
          updatedAt: new Date(),
        };

        if (validated.value.title !== undefined) patch.title = validated.value.title;
        if (validated.value.completed !== undefined) patch.completed = validated.value.completed;

        const [todo] = await this.db
          .updateTable("todos")
          .set(patch)
          .where("id", "=", existing.value.id)
          .returningAll()
          .execute();

        if (!todo) {
          throw new TodoNotFoundError();
        }

        return todo;
      },
      (e) => typedError(e),
    )();
  }

  async deleteTodo(input: DeleteTodoInput): Promise<DeleteTodoResult> {
    const validated = validateInput(deleteTodoSchema, input);
    if (validated.isErr()) return err(validated.error);

    const existing = await this.getTodoById({ id: validated.value.id, userId: validated.value.userId });
    if (existing.isErr()) return err(existing.error);

    return await fromAsyncThrowable(
      async () => {
        await this.db.deleteFrom("todos").where("id", "=", existing.value.id).execute();
        return { deleted: true as const };
      },
      (e) => typedError(e),
    )();
  }
}
