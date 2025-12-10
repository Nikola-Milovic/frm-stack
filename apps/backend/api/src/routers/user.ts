import { getDB } from "@yourcompany/backend-core/db";
import { orpc } from "#orpc";
import { logger } from "#log";
import { authOnly } from "#middleware";
import { getUserByIdSchema, UserNotAuthorizedError, UserService } from "#services/user";

export const userRouter = () => {
  const userService = new UserService(getDB(), logger);
  return orpc.router({
    get: {
      byId: orpc
        .use(authOnly)
        .input(getUserByIdSchema.omit({ userId: true }))
        .handler(async ({ context, input, errors }) => {
          const result = await userService.getUserById({ id: input.id, userId: context.user.id });
          if (result.isErr()) {
            if (result.error instanceof UserNotAuthorizedError) {
              throw errors.UNAUTHORIZED();
            }

            logger.error("Failed to get user by id", result.error, {
              input,
              userId: context.user.id,
            });

            throw errors.INTERNAL_SERVER_ERROR();
          }

          return result.value;
        }),
    },
  });
};
