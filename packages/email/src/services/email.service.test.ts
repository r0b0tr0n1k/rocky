import { describe, expect, it } from "vitest";
import { EmailService, renderReactEmail } from "./email.service.js";
import { PasswordResetEmail } from "../templates/react/index.js";
import type { SendEmailInput } from "../types/email.types.js";

const validInput: SendEmailInput = {
  to: [{ email: "farmer@rocky.gov.mk", name: "Fermer" }],
  from: { email: "noreply@rocky.gov.mk" },
  subject: "Reset your Rocky password",
  text: "Click the link to reset.",
};

describe("EmailService - dev fallback (no SMTP)", () => {
  it("returns status 'queued' and does not attempt a network send", async () => {
    const svc = new EmailService({ smtp: {}, quiet: true });
    const res = await svc.send(validInput);
    expect(res.status).toBe("queued");
    expect(res.to).toEqual(["farmer@rocky.gov.mk"]);
    expect(res.subject).toBe("Reset your Rocky password");
    expect(res.messageId).toBeTruthy();
  });
});

describe("EmailService - SMTP failure path", () => {
  it("returns status 'failed' with an error message instead of throwing", async () => {
    // Port 1 is never listening -> ECONNREFUSED, deterministically.
    const svc = new EmailService({
      smtp: { host: "127.0.0.1", port: 1, secure: false, from: "noreply@rocky.gov.mk" },
      quiet: true,
    });
    const res = await svc.send(validInput);
    expect(res.status).toBe("failed");
    expect(typeof res.error).toBe("string");
    expect(res.error!.length).toBeGreaterThan(0);
  });
});

describe("EmailService - input validation", () => {
  it("rejects empty recipients via sendEmailSchema", async () => {
    const svc = new EmailService({ smtp: {}, quiet: true });
    await expect(
      svc.send({ ...validInput, to: [] as unknown as SendEmailInput["to"] }),
    ).rejects.toThrow();
  });
});

describe("renderReactEmail - real React Email template", () => {
  it("renders PasswordResetEmail to HTML containing the recipient and reset URL", async () => {
    const html = await renderReactEmail(PasswordResetEmail, {
      url: "https://rocky.gov.mk/reset?t=abc123",
      name: "Fermer",
      locale: "EN",
    });
    expect(typeof html).toBe("string");
    expect(html).toContain("Fermer");
    expect(html).toContain("https://rocky.gov.mk/reset?t=abc123");
    expect(html).toContain("Reset");
  });

  it("renders the Macedonian (MK) copy when locale is MK", async () => {
    const html = await renderReactEmail(PasswordResetEmail, {
      url: "https://rocky.gov.mk/reset?t=abc123",
      name: "Ferrer",
      locale: "MK",
    });
    expect(html).toContain("\u0420\u0435\u0441\u0435\u0442\u0438\u0440\u0430\u045A\u0435");
    expect(html).toContain("Ferrer");
  });
});
