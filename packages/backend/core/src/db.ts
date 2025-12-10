import { Kysely, PostgresDialect, CamelCasePlugin, type Transaction as KyselyTransaction } from "kysely";
import { Pool } from "pg";

import type { DbConfig, EnvConfig } from "#config";
import type { Logger } from "#log";
import type { DB as DatabaseSchema } from "#schema";

let pool: Pool | null = null;
let dbInstance: Kysely<DatabaseSchema> | null = null;

/**
 * Connects once to the database and initializes the Kysely instance.
 * Call this function ONCE at app startup.
 */
export async function connectDB({
  logger,
  config,
}: {
  logger: Logger;
  config: DbConfig & { env: EnvConfig };
}): Promise<void> {
  if (pool) {
    logger.warn("connectDB called, but pool already exists. Skipping re-initialization.");
    return;
  }

  //Need SSL in staging/production to connect to RDS
  const sslConfig = ["staging", "production"].includes(config.env) ? { ssl: { rejectUnauthorized: false } } : {};

  pool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.name,
    ...sslConfig,
    max: config.env === "production" ? 25 : 10, // More connections in prod
    min: config.env === "production" ? 5 : 2, // Keep some warm
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 second timeout
    statement_timeout: 30000, // 30 second query timeout
  });

  try {
    await pool.query("SELECT NOW()");
    logger.info("Connected to the database successfully");
  } catch (err) {
    logger.error("Error connecting to the database:", err);
    throw err;
  }

  // Initialize Kysely with the pool
  dbInstance = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool,
    }),
    plugins: [new CamelCasePlugin()],
  });
}

/**
 * Returns the Kysely DB instance.
 * Throws an error if connectDB() hasn't been called yet.
 */
export function getDB(): Kysely<DatabaseSchema> {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB() before using getDB().");
  }
  return dbInstance;
}

export function getPGPool(): Pool {
  if (!pool) {
    throw new Error("Database not initialized. Call connectDB() before using getDB().");
  }
  return pool;
}

/**
 * Graceful cleanup: call this before your app terminates
 * (e.g., in a shutdown hook). Closes the pool and resets references.
 */
export async function dbCleanup({ logger }: { logger: Logger }): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    logger.debug("Kysely instance destroyed");
  }

  if (pool) {
    await pool.end();
    logger.info("Database pool closed");
  }

  pool = null;
  dbInstance = null;
}

// Type aliases for convenience
export type Transaction = KyselyTransaction<DatabaseSchema>;
export type DB = Kysely<DatabaseSchema>;

/**
 * Helper function to run database operations in a transaction
 *
 * @example
 * const result = await withTransaction(async (trx) => {
 *   await trx.insertInto('users').values({ ... }).execute();
 *   await trx.updateTable('accounts').set({ ... }).where(...).execute();
 *   return { success: true };
 * });
 */
export async function withTransaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
  const db = getDB();
  return await db.transaction().execute(callback);
}

/**
 * Helper function to check if database is connected
 */
export function isConnected(): boolean {
  return dbInstance !== null && pool !== null;
}
