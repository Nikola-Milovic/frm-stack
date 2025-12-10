import { z } from "zod";
import { dbConfigSchema } from "@yourcompany/backend-core/config";

const apiConfigSchema = z.object({
  env: z.enum(["dev", "production", "test", "staging"]),
  db: dbConfigSchema,
  port: z.number().min(3000).max(65535),
  version: z.string().min(1, "VERSION is required").default("dev"),
  requestLogging: z.boolean().optional().default(false),
  baseServiceUrl: z.string().min(1, "BASE_SERVICE_URL is required"),
  cors: z.object({
    origins: z.array(z.string()).min(1, "CORS_ORIGINS is required"),
  }),
  auth: z.object({
    baseUrl: z.string().min(1, "AUTH_BASE_URL is required"),
    google: z
      .object({
        clientId: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
        clientSecret: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      })
      .optional(),
  }),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export { apiConfigSchema };

export const appConfig = apiConfigSchema.parse({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
  version: process.env.VERSION,
  env: process.env.ENVIRONMENT,
  requestLogging: process.env.REQUEST_LOGGING === "true",
  db: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    name: process.env.PG_DB,
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : undefined,
  },
  baseServiceUrl: process.env.BASE_SERVICE_URL,
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [],
  },
  auth: {
    baseUrl: process.env.BASE_SERVICE_URL,
    google:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
});

export const isDev = appConfig.env === "dev";
