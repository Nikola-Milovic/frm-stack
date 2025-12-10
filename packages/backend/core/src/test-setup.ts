/**
 * Global test setup for all test suites
 *
 * This file is automatically loaded by Vitest before running tests.
 * It initializes the shared database container and cleans it up after all tests.
 */

import { afterAll, beforeAll } from "vitest";
import { cleanupSharedDatabaseHelper, getSharedDatabaseHelper } from "./test-helpers.ts";

beforeAll(async () => {
  if (process.env.DEBUG_TESTS) {
    console.log("[Test Suite] Starting test suite...");
  }

  // Initialize shared database container
  // This runs once for the entire test suite
  await getSharedDatabaseHelper();
}, 120000); // 2 minutes timeout for container startup

afterAll(async () => {
  if (process.env.DEBUG_TESTS) {
    console.log("[Test Suite] Cleaning up test suite...");
  }

  // Cleanup shared database container
  // This runs once after all tests complete
  await cleanupSharedDatabaseHelper();
}, 60000); // 1 minute timeout for cleanup
