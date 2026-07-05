// ── Vitest Global Setup ──
// This file runs before every test suite. It configures the test environment
// for the Diamond Seal Testing Doctrine.

import { afterAll, afterEach, beforeAll } from "vitest";

// ── Test isolation markers ──
// These are set on globalThis so test helpers can check if they're running in test mode.
beforeAll(() => {
  (globalThis as Record<string, unknown>).__VITEST__ = true;
});

afterAll(() => {
  delete (globalThis as Record<string, unknown>).__VITEST__;
});

// ── Reset faker seed for deterministic tests ──
// Tests can call faker.seed(123) to get deterministic data within a specific test.
afterEach(() => {
  // Clear any faker mocks between tests (if using faker.helpers.fake)
});

// ── Environment check ──
// Ensure tests never run against production databases.
if (process.env.DATABASE_URL?.includes("prod")) {
  throw new Error(
    "REFUSING TO RUN TESTS AGAINST PRODUCTION DATABASE. " + "Set TEST_DATABASE_URL for test database connection.",
  );
}
