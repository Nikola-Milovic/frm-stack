import { betterAuth, logger } from "better-auth";
import { customSession } from "better-auth/plugins";
import type { App } from "#app";
import { appConfig } from "#config";
import { logger as appLogger } from "#log";
import { getAuthConfig, authMiddleware, authHandler } from "@yourcompany/backend-core/auth";
import { getDB } from "@yourcompany/backend-core/db";
import { UserService } from "#services/user";

function createAuthConfig(): ReturnType<typeof betterAuth> {
  const baseConfig = getAuthConfig({
    cookiePrefix: "yourcompany",
    auth: appConfig.auth,
    cors: appConfig.cors,
    logger: appLogger,
  });

  const db = getDB();

  return betterAuth({
    ...baseConfig,
    databaseHooks: {
      user: {
        create: {
          before: async (_user) => {
            //
          },
          after: async (user) => {
            const result = await UserService.onUserCreated(db, logger, { userId: user.id });
            if (result.isErr()) {
              logger.error("Failed to setup user after creation", result.error, {
                userId: user.id,
              });
              throw result.error;
            }
          },
        },
      },
    },
    plugins: [
      customSession(async ({ user, session }) => {
        return {
          user,
          session,
        };
      }),
    ],
  });
}

type AuthInstance = ReturnType<typeof createAuthConfig>;

let authInstance: AuthInstance;

export type Auth = AuthInstance;

export function initAuth(): AuthInstance {
  if (authInstance) {
    return authInstance;
  }

  authInstance = createAuthConfig();
  logger.info("Auth initialized");

  return authInstance;
}

export function getAuth(): AuthInstance {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call initAuth() first.");
  }
  return authInstance;
}

export const registerAuth = (app: App) => {
  const auth = getAuth();

  app.use("*", authMiddleware(auth));

  app.on(["POST", "GET"], "/api/auth/*", authHandler(auth));
};
