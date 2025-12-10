import { type Result, err, fromAsyncThrowable } from "neverthrow";
import { validateInput } from "@yourcompany/backend-core/validation";
import { z } from "zod";
import type { DB } from "@yourcompany/backend-core/db";
import type { Logger } from "@yourcompany/backend-core/log";
import { typedError } from "@yourcompany/backend-core/validation";
import type { User } from "@yourcompany/backend-core/types";
import { sayHello } from "@yourcompany/hello/hello";

export const onUserCreatedSchema = z.object({
  userId: z.uuid(),
});
export type OnUserCreatedInput = z.infer<typeof onUserCreatedSchema>;
export type OnUserCreatedResult = Result<{ message: string }, Error>;

export const getUserByIdSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type GetUserByIdResult = Result<User, Error>;

// Custom error types
export class UserNotFoundError extends Error {
  constructor(message: string = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserNotAuthorizedError extends Error {
  constructor(message: string = "User not authorized") {
    super(message);
    this.name = "UserNotAuthorizedError";
  }
}

export class UserService {
  private readonly db: DB;
  private readonly logger: Logger;
  constructor(db: DB, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  async getUserById(input: GetUserByIdInput): Promise<GetUserByIdResult> {
    const validated = validateInput(getUserByIdSchema, input);
    if (validated.isErr()) {
      return err(validated.error);
    }

    this.logger.info("Getting user by id", {
      input,
    });

    return await fromAsyncThrowable(
      async () => {
        if (validated.value.userId !== input.id) {
          throw new UserNotAuthorizedError("User not authorized");
        }

        const result = await this.db
          .selectFrom("users")
          .where("id", "=", validated.value.id)
          .selectAll()
          .executeTakeFirstOrThrow();
        if (!result) {
          throw new UserNotFoundError("User not found");
        }

        this.logger.info(`Saynig hello to ${sayHello(result.name)}`);

        return result;
      },
      (e) => typedError(e),
    )();
  }

  static async onUserCreated(db: DB, logger: Logger, input: OnUserCreatedInput): Promise<OnUserCreatedResult> {
    const validated = validateInput(onUserCreatedSchema, input);
    if (validated.isErr()) {
      return err(validated.error);
    }

    logger.info("On user created", {
      userId: validated.value.userId,
    });

    return await fromAsyncThrowable(
      async () => {
        const result = await db
          .selectFrom("users")
          .where("id", "=", validated.value.userId)
          .selectAll()
          .executeTakeFirstOrThrow();
        if (!result) {
          throw new UserNotFoundError("User not found");
        }

        return { message: "User created successfully" };
      },
      (e) => typedError(e),
    )();
  }
}
