import { z } from "zod";

export const envConfigSchema = z.enum(["dev", "production", "test", "staging"]);
export type EnvConfig = z.infer<typeof envConfigSchema>;

// ---- Database Config ----
export const dbConfigSchema = z.object({
  host: z.string(),
  user: z.string(),
  password: z.string(),
  name: z.string(),
  port: z.number().optional(),
});

export type DbConfig = z.infer<typeof dbConfigSchema>;
