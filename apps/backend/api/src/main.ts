import { serve } from "@hono/node-server";
import { connectDB, dbCleanup } from "@yourcompany/backend-core/db";
import { logger } from "#log";
import { appConfig } from "#config";
import { createApp } from "#app";
import { initAuth, registerAuth } from "#auth";
import { registerORPC } from "#orpc";
import { registerRoutes } from "#routers/index";
import { router } from "#routers/index";
import { cors } from "hono/cors";
// import { initCronJobs, stopCronJobs } from "#cron";

const startServer = async () => {
  await connectDB({
    logger,
    config: {
      env: appConfig.env,
      ...appConfig.db,
    },
  });

  logger.debug("config", appConfig);

  initAuth();

  const app = createApp();

  app.use(
    cors({
      origin: appConfig.cors.origins,
      allowHeaders: ["Content-Type", "Authorization", "X-Radar-Token", "X-Radar-Reason"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );

  registerAuth(app);
  registerRoutes(app);
  registerORPC(app, router());

  // Initialize cron jobs
  // initCronJobs();

  const server = serve({
    fetch: app.fetch,
    port: appConfig.port,
    hostname: "0.0.0.0",
  });
  logger.info(`Starting server on port ${appConfig.port}`);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      try {
        logger.info(`received ${signal}, graceful shutdown`);

        server.close();
        // stopCronJobs();
        await dbCleanup({ logger });

        process.exit(0);
      } catch (err) {
        logger.error("failed to gracefully shutdown", err);
        process.exit(1);
      }
    });
  }

  // Handle unhandled rejections
  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection:", err);
    process.exit(1);
  });

  return server;
};

startServer();
