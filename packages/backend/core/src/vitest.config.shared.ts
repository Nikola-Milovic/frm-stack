import { defineConfig } from "vitest/config";

/**
 * Shared Vitest configuration for backend packages
 *
 * This configuration provides common settings for all backend test suites,
 * including the shared database pattern with optimized TRUNCATE resets.
 *
 * Usage in package vitest.config.ts:
 * ```typescript
 * import { defineConfig, mergeConfig } from "vitest/config";
 * import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";
 *
 * export default mergeConfig(
 *   createSharedTestConfig({
 *     setupFiles: ["./src/test-setup.ts"],
 *   }),
 *   defineConfig({
 *     // Package-specific overrides
 *   })
 * );
 * ```
 */

export interface SharedTestConfigOptions {
  /**
   * Path to test setup file(s)
   * Use this to initialize shared database or other global test infrastructure
   */
  setupFiles?: string | string[];

  /**
   * Maximum number of concurrent tests
   * Lower = safer, Higher = faster (adjust based on your machine)
   * @default 4
   */
  maxConcurrency?: number;

  /**
   * Hook timeout in milliseconds (for beforeAll/afterAll)
   * Should be high enough for container startup + migrations
   * @default 120000 (2 minutes)
   */
  hookTimeout?: number;

  /**
   * Individual test timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  testTimeout?: number;

  /**
   * Additional test file patterns to exclude
   * @default []
   */
  exclude?: string[];
}

/**
 * Creates a shared Vitest configuration with sensible defaults for backend testing
 * Returns a plain config object (not wrapped in defineConfig)
 */
export function createSharedTestConfig(options: SharedTestConfigOptions = {}) {
  const { setupFiles, maxConcurrency = 4, hookTimeout = 120000, testTimeout = 30000, exclude = [] } = options;

  return {
    test: {
      // Default exclusions
      exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**", ...exclude],

      // Global test setup
      ...(setupFiles && { setupFiles }),

      // Timeout configuration
      hookTimeout,
      testTimeout,

      // Parallel execution configuration
      // IMPORTANT: Use 'threads' pool (not 'forks') for mutex to work correctly
      pool: "threads" as const,
      isolate: false, // Reuse context for better performance

      // Limit concurrency to prevent overwhelming the shared database
      maxConcurrency,

      // Coverage configuration (can be overridden)
      coverage: {
        provider: "v8" as const,
        reporter: ["text", "json", "html"],
        exclude: ["**/node_modules/**", "**/dist/**", "**/*.test.ts", "**/*.spec.ts", "**/test-*.ts"],
      },
    },
  };
}

/**
 * Default shared configuration (without setup files)
 * Useful as a base for packages that don't need the shared database
 */
export const sharedTestConfig = defineConfig(createSharedTestConfig());
