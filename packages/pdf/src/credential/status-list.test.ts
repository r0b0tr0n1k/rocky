import { describe, expect, it } from "vitest";
import {
  buildCredentialStatusList,
  isStatusListStale,
  movementStateToCredentialStatus,
  passportStatusToCredentialStatus,
  resolveStatus,
  type CredentialStatusListEntry,
} from "./status-list.js";

const entries: CredentialStatusListEntry[] = [
  { sub: "pass-2", typ: "passport", status: "revoked", updatedAt: "2026-01-02T00:00:00.000Z" },
  { sub: "pass-1", typ: "passport", status: "valid", updatedAt: "2026-01-01T00:00:00.000Z" },
];

describe("credential status list (ADR-0084 §4)", () => {
  it("builds a deterministic, sorted, digest-protected list", () => {
    const now = new Date("2026-02-01T00:00:00.000Z");
    const list = buildCredentialStatusList(entries, { publisher: "rocky.gov.mk", now });
    expect(list.publisher).toBe("rocky.gov.mk");
    expect(list.issuedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(list.ttlSeconds).toBe(86_400 * 7);
    // entries are sorted by sub regardless of input order
    expect(list.entries.map((e) => e.sub)).toEqual(["pass-1", "pass-2"]);
    // digest is stable + non-empty
    expect(list.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(buildCredentialStatusList(entries, { publisher: "rocky.gov.mk", now }).digest).toBe(
      list.digest,
    );
  });

  it("digest changes when an entry status changes (tamper-evidence)", () => {
    const now = new Date("2026-02-01T00:00:00.000Z");
    const a = buildCredentialStatusList(entries, { publisher: "rocky.gov.mk", now });
    const b = buildCredentialStatusList(
      entries.map((e) => (e.sub === "pass-1" ? { ...e, status: "revoked" } : e)),
      { publisher: "rocky.gov.mk", now },
    );
    expect(a.digest).not.toBe(b.digest);
  });

  it("maps passport domain status to credential status", () => {
    expect(passportStatusToCredentialStatus("active")).toBe("valid");
    expect(passportStatusToCredentialStatus("issued")).toBe("valid");
    expect(passportStatusToCredentialStatus("reprinted")).toBe("valid");
    expect(passportStatusToCredentialStatus("seized")).toBe("suspended");
    expect(passportStatusToCredentialStatus("cancelled")).toBe("revoked");
    expect(passportStatusToCredentialStatus("archived")).toBe("revoked");
    expect(passportStatusToCredentialStatus("something-unknown")).toBe("valid");
  });

  it("movements have no revocation state yet -> always valid", () => {
    expect(movementStateToCredentialStatus("")).toBe("valid");
    expect(movementStateToCredentialStatus("unknown")).toBe("valid");
  });

  it("detects staleness beyond TTL", () => {
    const list = buildCredentialStatusList(entries, {
      publisher: "rocky.gov.mk",
      ttlSeconds: 86_400,
      now: new Date("2026-02-01T00:00:00.000Z"),
    });
    expect(isStatusListStale(list, new Date("2026-02-01T12:00:00.000Z"))).toBe(false);
    expect(isStatusListStale(list, new Date("2026-02-03T00:00:00.000Z"))).toBe(true);
  });

  it("resolves a credential status, defaulting to valid when unknown", () => {
    const list = buildCredentialStatusList(entries, { publisher: "rocky.gov.mk" });
    expect(resolveStatus(list, "pass-2")).toBe("revoked");
    expect(resolveStatus(list, "pass-1")).toBe("valid");
    expect(resolveStatus(list, "never-seen")).toBe("valid");
  });
});
