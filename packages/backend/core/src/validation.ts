import { ok, err } from "neverthrow";
import type { z } from "zod";

export const validateInput = <T extends z.ZodSchema>(schema: T, input: z.infer<T>) => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errorMessage = result.error.message;
    return err(new Error(errorMessage));
  }
  return ok(result.data);
};

export const resultParse = <T extends z.ZodRawShape>(schema: z.ZodObject<T>, value: unknown) => {
  const result = schema.safeParse(value);

  if (!result.success) {
    return err({
      message: result.error.flatten(),
    });
  }

  return ok({
    data: result.data,
  });
};

export const typedError = (e: unknown): Error => {
  if (e instanceof Error) {
    return e;
  }
  return new Error(String(e));
};
