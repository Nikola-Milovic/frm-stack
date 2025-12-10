# Shared Vitest Configuration

A reusable Vitest configuration for all backend packages, providing consistent test setup and optimized defaults.

## Features

- ✅ **Shared database pattern** - Optimized for testcontainers with TRUNCATE resets
- ✅ **Parallel execution** - Thread pool with configurable concurrency
- ✅ **Sensible timeouts** - 2min for setup, 30sec for tests
- ✅ **Coverage ready** - Pre-configured with v8 provider
- ✅ **Merge-friendly** - Easy to extend with package-specific settings

## Usage

### Basic Usage

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

export default mergeConfig(
  // createSharedTestConfig returns a plain config object
  createSharedTestConfig({
    setupFiles: ["./src/test-setup.ts"],
  }),
  defineConfig({
    // Package-specific overrides
  })
);
```

**Note:** `createSharedTestConfig()` returns a **plain config object** (not wrapped in `defineConfig`), which is required for `mergeConfig` to work properly.

### With Custom Options

```typescript
export default mergeConfig(
  createSharedTestConfig({
    setupFiles: ["./src/test-setup.ts"],
    maxConcurrency: 8,        // More parallel tests
    hookTimeout: 180000,      // 3 minutes for slow container startup
    testTimeout: 60000,       // 1 minute per test
    exclude: ["**/*.e2e.test.ts"], // Additional exclusions
  }),
  defineConfig({
    // Your config
  })
);
```

### With Package-Specific Aliases

```typescript
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default mergeConfig(
  createSharedTestConfig({
    setupFiles: ["./src/test-setup.ts"],
  }),
  defineConfig({
    resolve: {
      alias: [
        { find: /^#(.*)$/, replacement: resolve(__dirname, "./src/$1") },
      ],
    },
    test: {
      coverage: {
        include: ["src/**/*.ts"],
      },
    },
  })
);
```

## Configuration Options

### `SharedTestConfigOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `setupFiles` | `string \| string[]` | `undefined` | Path(s) to global test setup file(s) |
| `maxConcurrency` | `number` | `4` | Maximum concurrent tests |
| `hookTimeout` | `number` | `120000` | Timeout for beforeAll/afterAll (ms) |
| `testTimeout` | `number` | `30000` | Timeout per test (ms) |
| `exclude` | `string[]` | `[]` | Additional file patterns to exclude |

## Default Configuration

The shared config includes:

```typescript
{
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    pool: "threads",           // Thread pool for mutex safety
    isolate: false,            // Reuse context for speed
    maxConcurrency: 4,         // Limit concurrent tests
    hookTimeout: 120000,       // 2 minutes
    testTimeout: 30000,        // 30 seconds
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/test-*.ts",
      ],
    },
  },
}
```

## Examples

### Monorepo Package

```typescript
// apps/backend/api/vitest.config.ts
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

export default mergeConfig(
  createSharedTestConfig({
    // Use shared test setup from core package
    setupFiles: ["../../packages/backend/core/src/test-setup.ts"],
  }),
  defineConfig({
    test: {
      coverage: {
        include: ["src/**/*.ts"],
      },
    },
  })
);
```

### Without Shared Database

```typescript
// Some packages don't need the shared database
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

export default createSharedTestConfig({
  // No setupFiles = no shared database initialization
  maxConcurrency: 10, // Can run more tests in parallel
});
```

### E2E Tests Configuration

```typescript
// Separate config for E2E tests
import { createSharedTestConfig } from "@yourcompany/backend-core/vitest.config.shared";

export default mergeConfig(
  createSharedTestConfig({
    hookTimeout: 300000,  // 5 minutes for E2E setup
    testTimeout: 120000,  // 2 minutes per E2E test
    maxConcurrency: 1,    // Run E2E tests sequentially
  }),
  defineConfig({
    test: {
      include: ["**/*.e2e.test.ts"],
    },
  })
);
```

## Performance Tuning

### Conservative (Safest)
```typescript
createSharedTestConfig({
  maxConcurrency: 1,  // Sequential
})
```

### Balanced (Recommended)
```typescript
createSharedTestConfig({
  maxConcurrency: 4,  // Good parallelism
})
```

### Aggressive (Fast)
```typescript
createSharedTestConfig({
  maxConcurrency: 10, // Many parallel tests
})
// ⚠️ May overwhelm connection pool
```

## See Also

- [Testing Guide](../../../docs/TESTING.md) - Complete testing patterns and best practices
- [Test Helpers](./test-helpers.ts) - Shared database utilities
- [Test Setup](./test-setup.ts) - Global test initialization
