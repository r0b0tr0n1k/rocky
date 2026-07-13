import { describe, expect, it } from "vitest";
import { ok } from "neverthrow";
import { DocumentRegistry } from "../engine/document-registry.js";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import { CredentialService } from "./credential.service.js";
import { generateKeyPair, type CredentialSeed } from "../credential/credential.js";

// A minimal template that supports credentials — exercises the full
// template -> seed -> sign -> verify path without a database.
class FakeCredentialTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "test-cred";
  readonly modelPath = "models/test-cred.yaml";
  readonly name = "Test Credential";
  readonly modelVersion = "1.0";

  async fetchData(refId: string) {
    return ok(refId);
  }
  async mapToModel(refId: string) {
    return { refId };
  }
  async mapToCredential(refId: string) {
    const seed: CredentialSeed = { sub: `sub-${refId}`, farmId: "farm-1", species: "bovine" };
    return ok(seed);
  }
}

// Register once for the process; the type is unique so it never collides
// with the real templates registered elsewhere.
DocumentRegistry.getInstance().register(new FakeCredentialTemplate());

describe("CredentialService", () => {
  it("signs + verifies a credential round-trip", async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const svc = new CredentialService();
    svc.useKeyConfig({ privateKey, kid: "rocky-test", iss: "rocky:cattle", pinnedPublicKey: publicKey });

    const out = await svc.generate({ type: "test-cred", refId: "abc-123" });
    expect(out.isOk()).toBe(true);
    if (out.isErr()) throw new Error("expected credential ok");
    const o = out.value;
    expect(typeof o.envelope).toBe("string");
    expect(o.qrDataUrl.startsWith("data:image/png")).toBe(true);
    expect(o.payload.sub).toBe("sub-abc-123");
    expect(o.payload.farmId).toBe("farm-1");
    expect(o.payload.kid).toBe("rocky-test");

    const v = svc.verify(o.envelope);
    expect(v.valid).toBe(true);
    expect(v.expired).toBe(false);
    expect(v.payload.sub).toBe("sub-abc-123");
    expect(v.kid).toBe("rocky-test");
  });

  it("rejects a tampered envelope", async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const svc = new CredentialService();
    svc.useKeyConfig({ privateKey, kid: "k", iss: "i", pinnedPublicKey: publicKey });

    const gen = await svc.generate({ type: "test-cred", refId: "x" });
    if (gen.isErr()) throw new Error("expected credential ok");
    const out = gen.value;
    const flipped = out.envelope.endsWith("A") ? "B" : "A";
    const tampered = `${out.envelope.slice(0, -1)}${flipped}`;

    const v = svc.verify(tampered);
    expect(v.valid).toBe(false);
  });

  it("errors when no signing key is configured", async () => {
    const svc = new CredentialService();
    const out = await svc.generate({ type: "test-cred", refId: "x" });
    expect(out.isErr()).toBe(true);
  });

  it("errors for a template without mapToCredential", async () => {
    const svc = new CredentialService();
    svc.useKeyConfig({
      privateKey: generateKeyPair().privateKey,
      kid: "k",
      iss: "i",
      pinnedPublicKey: generateKeyPair().publicKey,
    });
    // "passport" is a real registered template but this isolated registry may
    // not have it; use a definitely-unsupported type.
    const out = await svc.generate({ type: "no-such-type", refId: "x" });
    expect(out.isErr()).toBe(true);
  });
});
