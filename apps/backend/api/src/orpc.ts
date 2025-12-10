import { os, type Router } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import type { User } from "better-auth";
import type { Session } from "better-auth";
import type { Context } from "hono";
import type { App } from "#app";
import { logger } from "#log";
import { appConfig } from "#config";
import { getClientIp, getClientUserAgent } from "@yourcompany/backend-core/utils/client-info";

export const errors = {
  UNAUTHORIZED: {
    message: "Unauthorized",
    status: 401,
  },
  BAD_REQUEST: {
    message: "Bad request",
    status: 400,
  },
  FORBIDDEN: {
    message: "Forbidden",
    status: 403,
  },
  NOT_FOUND: {
    message: "Not found",
    status: 404,
  },
  INTERNAL_SERVER_ERROR: {
    message: "Internal server error",
    status: 500,
  },
  NO_DATA: {
    message: "No data",
    status: 204,
  },
};

export const orpc = os
  .$context<{
    headers: Headers;
    user:
      | (User & {
          role: string;
          permissions: string[];
          banned: boolean;
          banReason: string | null;
          bannedAt: Date | null;
        })
      | null;
    session: Session | null;
    clientIp?: string;
    clientUserAgent?: string;
  }>()
  .errors(errors);

// biome-ignore lint/suspicious/noExplicitAny: To prevent cyclic dependency TODO: could be improved
export const registerORPC = (app: App, router: Router<any, any>) => {
  const handler = new RPCHandler(router);

  app.use("/rpc/*", async (c: Context) => {
    try {
      appConfig.requestLogging &&
        logger.debug("RPC Request", {
          method: c.req.method,
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers.entries()),
          body: await c.req.raw.clone().text(),
        });

      const { matched, response } = await handler.handle(c.req.raw, {
        prefix: "/rpc",
        context: {
          headers: c.req.raw.headers,
          user: c.get("user"),
          session: c.get("session"),
          clientIp: getClientIp(c.req.raw.headers),
          clientUserAgent: getClientUserAgent(c.req.raw.headers),
        },
      });

      if (matched) {
        // Clone the response to safely read the body
        let bodyPreview: string | undefined;
        if (response.body) {
          try {
            const cloned = response.clone();
            const contentType = cloned.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const text = await cloned.text();
              bodyPreview = text.slice(0, 1024);
            } else if (contentType.startsWith("text/")) {
              const text = await cloned.text();
              bodyPreview = text.slice(0, 1024);
            } else {
              bodyPreview = "<non-text body>";
            }
          } catch (err) {
            bodyPreview = `<error reading body: ${err}>`;
          }
        }

        if (response.status >= 400 && response.status < 600) {
          appConfig.requestLogging &&
            logger.error("RPC Error Response", {
              method: c.req.method,
              url: c.req.url,
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              bodyPreview,
            });
        }

        return c.newResponse(response.body, response);
      }

      // RPC route not found - return 404
      logger.warn("RPC route not found", {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
      });

      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "RPC route not found",
          },
        },
        404,
      );
    } catch (err) {
      logger.error("RPC middleware error", err);

      // Return error response instead of throwing
      return c.json(
        {
          error: { code: "INTERNAL_SERVER_ERROR", message: "Request failed" },
        },
        500,
      );
    }
  });
};
