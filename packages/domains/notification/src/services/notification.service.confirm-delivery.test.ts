import { describe, expect, it, vi } from "vitest";
import { NotificationService } from "./notification.service.js";
import { NOTIFICATION_ERRORS } from "../errors/notification.errors.js";

/** Minimal repo double — only the surface confirmDelivery touches. */
function makeRepo(over: Partial<Record<string, unknown>> = {}) {
  return {
    updateById: vi.fn(),
    ...over,
  } as unknown as import("../repositories/notification.repository.js").NotificationRepository;
}

describe("NotificationService.confirmDelivery", () => {
  it("records acknowledgedAt + deliveredAt and flips status to DELIVERED", async () => {
    const repo = makeRepo();
    const acknowledgedAt = new Date("2026-07-13T10:00:00.000Z");
    (repo.updateById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "n1",
      status: "DELIVERED",
      acknowledgedAt,
      deliveredAt: acknowledgedAt,
    });
    const svc = new NotificationService(repo);

    const res = await svc.confirmDelivery({ id: "n1", userId: "u1" });

    expect(res.isOk()).toBe(true);
    expect(repo.updateById).toHaveBeenCalledWith(
      "n1",
      "u1",
      expect.objectContaining({
        status: "DELIVERED",
        acknowledgedAt: expect.any(Date),
        deliveredAt: expect.any(Date),
      }),
    );
    if (res.isOk()) {
      expect(res.value.acknowledgedAt).toBe(acknowledgedAt);
      expect(res.value.status).toBe("DELIVERED");
    }
  });

  it("returns an error when the notification does not exist", async () => {
    const repo = makeRepo();
    (repo.updateById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const svc = new NotificationService(repo);

    const res = await svc.confirmDelivery({ id: "ghost", userId: "u1" });

    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error.message).toContain(NOTIFICATION_ERRORS.NOT_FOUND);
    }
  });
});
