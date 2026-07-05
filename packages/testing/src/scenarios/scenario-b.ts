// ── Scenario B: Testing Domain Services (The Mocked Shovel) ──
//
// What you test: Your Business Logic (L4 Domain Services).
//
// What you do NOT need: A real database connection.
//
// The approach: Mock the Repository (the shovel that digs into Drizzle),
//   not Drizzle itself!
//
// The Law: You DO NOT mock Drizzle (`@rocky/database`).
//   You mock the Repository interface!

import { vi } from "vitest";

/**
 * Create a mock repository function that returns the given value.
 *
 * The returned function tracks calls via vitest's `vi.fn()`.
 *
 * ## Usage
 *
 * ```typescript
 * import { test, expect } from "vitest";
 * import { EarTagOrderFactory, mockRepoReturn } from "@rocky/testing";
 * import { ok } from "neverthrow";
 *
 * test("Service calls repository correctly", async () => {
 *   const order = new EarTagOrderFactory("org_123").createDraft();
 *
 *   const mockRepo = {
 *     findById: mockRepoReturn(ok(order)),
 *     updateStatus: mockRepoReturn(ok(true)),
 *   };
 *
 *   const result = await service.submitOrder(order.id);
 *   expect(mockRepo.findById).toHaveBeenCalledWith(order.id);
 * });
 * ```
 */
export function mockRepoReturn<T>(value: T) {
  const mock = vi.fn<() => Promise<T>>();
  // vitest's mockResolvedValue has stricter Awaited constraint than what we need
  // biome-ignore lint/suspicious/noExplicitAny: acceptable in testing
  (mock as any).mockResolvedValue(value);
  return mock;
}

/**
 * Create a mock repository function that throws the given error.
 *
 * ## Usage
 *
 * ```typescript
 * test("Service handles not found", async () => {
 *   const mockRepo = {
 *     findById: mockRepoThrow(new NotFoundError("EarTagOrder", id)),
 *   };
 *   const service = new EarTagService(mockRepo);
 *   const result = await service.submitOrder(id);
 *   expect(result.isErr()).toBe(true);
 * });
 * ```
 */
export function mockRepoThrow(error: Error) {
  const mock = vi.fn<() => Promise<never>>();
  // biome-ignore lint/suspicious/noExplicitAny: acceptable in testing
  (mock as any).mockRejectedValue(error);
  return mock;
}
