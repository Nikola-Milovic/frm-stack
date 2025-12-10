import { getDB } from "@yourcompany/backend-core/db";
import { orpc } from "#orpc";
import { logger } from "#log";
import { authOnly } from "#middleware";
import {
  TodoNotAuthorizedError,
  TodoNotFoundError,
  TodoService,
  createTodoSchema,
  deleteTodoSchema,
  getTodoByIdSchema,
  listTodosSchema,
  updateTodoSchema,
} from "#services/todo";

export const todoRouter = () => {
  const todoService = new TodoService(getDB(), logger);

  return orpc.router({
    list: orpc
      .use(authOnly)
      .input(listTodosSchema.omit({ userId: true }))
      .handler(async ({ context, input, errors }) => {
        const result = await todoService.listTodos({ userId: context.user.id, completed: input.completed });
        if (result.isErr()) {
          logger.error("Failed to list todos", result.error, { input, userId: context.user.id });
          throw errors.INTERNAL_SERVER_ERROR();
        }
        return result.value;
      }),

    get: {
      byId: orpc
        .use(authOnly)
        .input(getTodoByIdSchema.omit({ userId: true }))
        .handler(async ({ context, input, errors }) => {
          const result = await todoService.getTodoById({ userId: context.user.id, id: input.id });
          if (result.isErr()) {
            if (result.error instanceof TodoNotAuthorizedError) {
              throw errors.FORBIDDEN();
            }
            if (result.error instanceof TodoNotFoundError) {
              throw errors.NOT_FOUND();
            }

            logger.error("Failed to get todo by id", result.error, { input, userId: context.user.id });
            throw errors.INTERNAL_SERVER_ERROR();
          }
          return result.value;
        }),
    },

    create: orpc
      .use(authOnly)
      .input(createTodoSchema.omit({ userId: true }))
      .handler(async ({ context, input, errors }) => {
        const result = await todoService.createTodo({ userId: context.user.id, title: input.title });
        if (result.isErr()) {
          logger.error("Failed to create todo", result.error, { input, userId: context.user.id });
          throw errors.BAD_REQUEST();
        }
        return result.value;
      }),

    update: orpc
      .use(authOnly)
      .input(updateTodoSchema.omit({ userId: true }))
      .handler(async ({ context, input, errors }) => {
        const result = await todoService.updateTodo({
          userId: context.user.id,
          id: input.id,
          title: input.title,
          completed: input.completed,
        });
        if (result.isErr()) {
          if (result.error instanceof TodoNotAuthorizedError) {
            throw errors.FORBIDDEN();
          }
          if (result.error instanceof TodoNotFoundError) {
            throw errors.NOT_FOUND();
          }

          logger.error("Failed to update todo", result.error, { input, userId: context.user.id });
          throw errors.BAD_REQUEST();
        }
        return result.value;
      }),

    delete: orpc
      .use(authOnly)
      .input(deleteTodoSchema.omit({ userId: true }))
      .handler(async ({ context, input, errors }) => {
        const result = await todoService.deleteTodo({ userId: context.user.id, id: input.id });
        if (result.isErr()) {
          if (result.error instanceof TodoNotAuthorizedError) {
            throw errors.FORBIDDEN();
          }
          if (result.error instanceof TodoNotFoundError) {
            throw errors.NOT_FOUND();
          }

          logger.error("Failed to delete todo", result.error, { input, userId: context.user.id });
          throw errors.INTERNAL_SERVER_ERROR();
        }
        return result.value;
      }),
  });
};
