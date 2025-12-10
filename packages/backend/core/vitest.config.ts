import { defineConfig, mergeConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createSharedTestConfig } from "./src/vitest.config.shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default mergeConfig(
  createSharedTestConfig({
    setupFiles: ["./src/test-setup.ts"],
    maxConcurrency: 4,
  }),
  defineConfig({
    resolve: {
      conditions: ["typescript"],
      alias: [
        // Map "#<path>" specifiers to our local src directory
        { find: /^#(.*)$/, replacement: resolve(__dirname, "./src/$1") },
      ],
    },
    test: {
      // Package-specific exclusions
      exclude: ["**/*.concurrency.test.ts"],

      // Package-specific coverage settings
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/test-*.ts"],
      },
    },
  })
);
