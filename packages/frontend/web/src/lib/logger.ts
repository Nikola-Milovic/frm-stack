interface Logger {
  info(msg: string, properties?: Record<string, unknown>): void;
  debug(msg: string, properties?: Record<string, unknown>): void;
  warn(msg: string, properties?: Record<string, unknown>): void;
  error(msg: string, error: Error | unknown, properties?: Record<string, unknown>): void;
}

export const logger: Logger = {
  info: (msg, properties) => console.log(msg, properties),
  debug: (msg, properties) => console.log(msg, properties),
  warn: (msg, properties) => console.log(msg, properties),
  error: (msg, error, properties) => console.log(msg, error, properties),
};
