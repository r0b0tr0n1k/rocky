import { describe, expect, it } from "vitest";
import { buildCredentialBatch, type CredentialBatchEntry } from "./batch.js";

const entries: CredentialBatchEntry[] = [
  { sub: "sub-b", typ: "passport", envelope: "env-b", qrDataUrl: "qr-b" },
  { sub: "sub-a", typ: "passport", envelope: "env-a", qrDataUrl: "qr-a" },
];

describe("buildCredentialBatch (ADR-0084 §6)", () => {
  it("emits a deterministic, integrity-protected manifest", () => {
    const m1 = buildCredentialBatch(entries, { publisher: "rocky:cattle" });
    const m2 = buildCredentialBatch(entries, { publisher: "rocky:cattle" });
    expect(m1.digest).toBe(m2.digest);
    expect(m1.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(m1.count).toBe(2);
    expect(m1.publisher).toBe("rocky:cattle");
    expect(m1.entries.map((e) => e.sub)).toEqual(["sub-a", "sub-b"]);
  });

  it("changes the digest when an entry is tampered", () => {
    const clean = buildCredentialBatch(entries, { publisher: "rocky:cattle" });
    const tampered = buildCredentialBatch(
      [{ ...entries[0], envelope: "env-b-MODIFIED" }, entries[1]],
      { publisher: "rocky:cattle" },
    );
    expect(tampered.digest).not.toBe(clean.digest);
  });

  it("derives a stable batchId from publisher + issuedAt", () => {
    const m = buildCredentialBatch(entries, { publisher: "rocky:cattle", now: new Date("2026-07-13T00:00:00Z") });
    expect(m.batchId).toBe("rocky:cattle:batch:2026-07-13T00:00:00.000Z");
    expect(m.ttlSeconds).toBe(86_400 * 7);
  });
});
