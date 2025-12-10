import { pino } from "pino";
import type { Logger as PinoLogger } from "pino";

export interface LoggerConfig {
  env: string;
}

// Factory function to create logger with injected config
export function createLogger(config: LoggerConfig): Logger {
  const pinoLogger = pino({
    level: config.env === "dev" ? "debug" : "info",
  });
  return withLogger(pinoLogger).build();
}

export interface Logger {
  info(msg: string, properties?: Record<string, unknown>): void;
  debug(msg: string, properties?: Record<string, unknown>): void;
  warn(msg: string, properties?: Record<string, unknown>): void;
  error(msg: string, error: Error | unknown, properties?: Record<string, unknown>): void;
}

export class CustomLogger implements Logger {
  private pino: PinoLogger;
  private defaultProperties: Record<string, unknown>;

  constructor(pino: PinoLogger, level?: string, defaultProperties?: Record<string, unknown>) {
    this.pino = pino;
    this.defaultProperties = defaultProperties || {};

    if (level) {
      this.pino.level = level;
    }
  }

  info(msg: string, properties?: Record<string, unknown>): void {
    this.pino.info({ ...this.defaultProperties, ...properties }, msg);
  }

  debug(msg: string, properties?: Record<string, unknown>): void {
    this.pino.debug({ ...this.defaultProperties, ...properties }, msg);
  }

  warn(msg: string, properties?: Record<string, unknown>): void {
    this.pino.warn({ ...this.defaultProperties, ...properties }, msg);
  }

  error(msg: string, error: Error | unknown, properties?: Record<string, unknown>): void {
    const errorObj =
      error instanceof Error
        ? {
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
          }
        : { error };

    this.pino.error({ ...this.defaultProperties, ...properties, ...errorObj }, msg);
  }
}

export class LoggerBuilder {
  private level?: string;
  private properties: Record<string, unknown> = {};
  private pinoInstance: PinoLogger;

  constructor(pinoInstance: PinoLogger) {
    this.pinoInstance = pinoInstance;
  }

  withLevel(level: "trace" | "debug" | "info" | "warn" | "error" | "fatal"): LoggerBuilder {
    this.level = level;
    return this;
  }

  withAdditionalProperties(properties: Record<string, unknown>): LoggerBuilder {
    this.properties = { ...this.properties, ...properties };
    return this;
  }

  withProperty(key: string, value: unknown): LoggerBuilder {
    this.properties[key] = value;
    return this;
  }

  build(): Logger {
    return new CustomLogger(this.pinoInstance, this.level, this.properties);
  }
}

export function withLogger(pinoInstance: PinoLogger): LoggerBuilder {
  return new LoggerBuilder(pinoInstance);
}
