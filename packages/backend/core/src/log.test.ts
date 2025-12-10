import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Logger as PinoLogger } from "pino";
import { withLogger, CustomLogger, type Logger } from "#log";

vi.mock("./config.js", () => ({
  envConfig: {
    env: "test",
  },
}));

describe("CustomLogger", () => {
  let mockPino: {
    level: string;
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let logger: Logger;

  beforeEach(() => {
    mockPino = {
      level: "info",
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  describe("basic logging", () => {
    beforeEach(() => {
      logger = new CustomLogger(mockPino as unknown as PinoLogger);
    });

    it("should log info messages", () => {
      logger.info("test message", { userId: 123 });
      expect(mockPino.info).toHaveBeenCalledWith({ userId: 123 }, "test message");
    });

    it("should log debug messages", () => {
      logger.debug("debug message", { debug: true });
      expect(mockPino.debug).toHaveBeenCalledWith({ debug: true }, "debug message");
    });

    it("should log warn messages", () => {
      logger.warn("warning message", { level: "high" });
      expect(mockPino.warn).toHaveBeenCalledWith({ level: "high" }, "warning message");
    });

    it("should log error messages with Error object", () => {
      const error = new Error("test error");
      logger.error("error occurred", error, { context: "test" });

      expect(mockPino.error).toHaveBeenCalledWith(
        {
          context: "test",
          error: {
            message: "test error",
            stack: error.stack,
            name: "Error",
          },
        },
        "error occurred",
      );
    });

    it("should log error messages with non-Error object", () => {
      const errorObj = { code: "ERR_001", details: "Something went wrong" };
      logger.error("error occurred", errorObj, { context: "test" });

      expect(mockPino.error).toHaveBeenCalledWith(
        {
          context: "test",
          error: errorObj,
        },
        "error occurred",
      );
    });

    it("should work without properties", () => {
      logger.info("simple message");
      expect(mockPino.info).toHaveBeenCalledWith({}, "simple message");
    });
  });

  describe("with default properties", () => {
    beforeEach(() => {
      logger = new CustomLogger(mockPino as unknown as PinoLogger, undefined, {
        service: "api",
        env: "test",
      });
    });

    it("should include default properties in all logs", () => {
      logger.info("test", { userId: 1 });
      expect(mockPino.info).toHaveBeenCalledWith(
        {
          service: "api",
          env: "test",
          userId: 1,
        },
        "test",
      );
    });

    it("should allow overriding default properties", () => {
      logger.info("test", { service: "worker" });
      expect(mockPino.info).toHaveBeenCalledWith(
        {
          service: "worker",
          env: "test",
        },
        "test",
      );
    });
  });

  describe("LoggerBuilder", () => {
    it("should build logger with level", () => {
      const _logger = withLogger(mockPino as unknown as PinoLogger)
        .withLevel("debug")
        .build();

      expect(mockPino.level).toBe("debug");
    });

    it("should build logger with additional properties", () => {
      const logger = withLogger(mockPino as unknown as PinoLogger)
        .withAdditionalProperties({ service: "api", version: "1.0" })
        .build();

      logger.info("test");
      expect(mockPino.info).toHaveBeenCalledWith(
        {
          service: "api",
          version: "1.0",
        },
        "test",
      );
    });

    it("should build logger with individual properties", () => {
      const logger = withLogger(mockPino as unknown as PinoLogger)
        .withProperty("service", "api")
        .withProperty("version", "1.0")
        .build();

      logger.info("test");
      expect(mockPino.info).toHaveBeenCalledWith(
        {
          service: "api",
          version: "1.0",
        },
        "test",
      );
    });

    it("should chain multiple builder methods", () => {
      const logger = withLogger(mockPino as unknown as PinoLogger)
        .withLevel("debug")
        .withAdditionalProperties({ service: "api" })
        .withProperty("region", "us-east")
        .build();

      expect(mockPino.level).toBe("debug");
      logger.info("test");
      expect(mockPino.info).toHaveBeenCalledWith(
        {
          service: "api",
          region: "us-east",
        },
        "test",
      );
    });
  });
});
