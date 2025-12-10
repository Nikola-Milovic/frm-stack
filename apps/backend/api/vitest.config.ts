import { defineConfig, mergeConfig, type Plugin } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = resolve(__dirname, "./src");

/** TODO: if this can be improved
 * Custom resolver plugin that only resolves #* imports for files within this package.
 * This prevents the alias from interfering with other workspace packages that use
 * their own #* subpath imports (defined in their package.json "imports" field).
 */
function localSubpathImportsPlugin(): Plugin {
  return {
    name: "local-subpath-imports",
    resolveId(source, importer) {
      // Only handle #* imports
      if (!source.startsWith("#")) {
        return null;
      }

      // Only resolve if the importer is within this package's src directory
      if (importer?.startsWith(srcDir)) {
        const resolved = resolve(srcDir, source.slice(1));
        // Try .ts extension first, then let Vite handle the rest
        return `${resolved}.ts`;
      }

      // Let other packages use their own package.json "imports" field
      return null;
    },
  };
}

export default mergeConfig(
  createSharedTestConfig({
    // Initialize shared database for this package
    // TODO: can this be done better?
    setupFiles: ["../../../packages/backend/core/src/test-setup.ts"],
    maxConcurrency: 4,
  }),
  defineConfig({
    plugins: [localSubpathImportsPlugin()],
    resolve: {
      conditions: ["typescript"],
    },
    test: {
      // Package-specific coverage settings
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      },
    },
  }),
);
