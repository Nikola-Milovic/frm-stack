import type { BetterAuthOptions } from "better-auth";
import type { Logger } from "#log";
import { getPGPool } from "#db";
import type { Context, Next } from "hono";

export interface AuthConfigParams {
  cookiePrefix: string;
  auth: {
    baseUrl: string;
    google?:
      | {
          clientId: string;
          clientSecret: string;
        }
      | undefined;
  };
  cors: {
    origins: string[];
  };
  logger: Logger;
}

export function getAuthConfig(params: AuthConfigParams): BetterAuthOptions {
  const pgPool = getPGPool();

  return {
    baseURL: params.auth.baseUrl,
    database: pgPool,
    trustedOrigins: params.cors.origins,
    advanced: {
      cookiePrefix: params.cookiePrefix,
      database: {
        generateId: false,
      },
    },
    user: {
      modelName: "users",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    // Database uses snake_case for column names, while better-auth expects camelCase
    session: {
      modelName: "sessions",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
      },
    },
    account: {
      modelName: "accounts",
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "verifications",
      fields: {
        createdAt: "created_at",
        updatedAt: "updated_at",
        expiresAt: "expires_at",
      },
    },
    socialProviders: {
      google: params.auth.google
        ? {
            clientId: params.auth.google.clientId,
            clientSecret: params.auth.google.clientSecret,
          }
        : undefined,
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        console.log(user, url, token, request);
      },
    },
  };
}

export function authMiddleware<
  TAuthInstance extends {
    api: {
      getSession: (options: {
        headers: Headers;
      }) => Promise<{ user: { id: string; email: string; username?: string | null }; session: unknown } | null>;
    };
  },
>(authInstance: TAuthInstance) {
  return async (c: Context, next: Next) => {
    const session = await authInstance.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);

    return next();
  };
}

export function authHandler<TAuthInstance extends { handler: (request: Request) => Response | Promise<Response> }>(
  authInstance: TAuthInstance,
) {
  return (c: Context) => {
    return authInstance.handler(c.req.raw);
  };
}
