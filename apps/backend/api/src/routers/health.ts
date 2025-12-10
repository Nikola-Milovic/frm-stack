import { Hono } from "hono";
import { logger } from "#log";

// Create the health route using OpenAPI
export function healthRouter() {
  const router = new Hono().basePath("/");
  router.get("/", async (c) => {
    try {
      // Add health check logic here if needed
      return c.json({ status: "ok" });
    } catch (e) {
      logger.error("Health check failed", e);
      return c.json({ status: "unhealthy" }, 500);
    }
  });

  return router;
}
