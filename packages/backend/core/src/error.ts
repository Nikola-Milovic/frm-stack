export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }
  return "Unknown error";
};

export const mapKyselyError = (e: unknown, msg?: string): Error => {
  if (e instanceof Error) {
    if (e.message.includes("no result")) {
      return new NotFoundError(`${msg ? `${msg}: ` : ""}${e.message}`);
    }
    return e;
  }
  return new Error(String(e));
};
