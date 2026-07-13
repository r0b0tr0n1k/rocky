import { describe, expect, it } from "vitest";
import { glnCheckDigit, glnFromId, isValidGln } from "./gs1.js";

describe("GS1 GLN (ADR-0087 — ESPR Art 12 operator/facility identifier)", () => {
  it("produces a 13-digit numeric GLN", () => {
    const gln = glnFromId("farm-9");
    expect(gln).toMatch(/^\d{13}$/);
  });

  it("the emitted GLN is self-validating (check digit correct)", () => {
    expect(isValidGln(glnFromId("farm-9"))).toBe(true);
    expect(isValidGln(glnFromId("operator-x"))).toBe(true);
  });

  it("derivation is deterministic (same id → same GLN)", () => {
    expect(glnFromId("farm-9")).toBe(glnFromId("farm-9"));
  });

  it("distinct ids → distinct GLNs", () => {
    expect(glnFromId("farm-9")).not.toBe(glnFromId("farm-10"));
  });

  it("rejects malformed GLNs", () => {
    expect(isValidGln("123")).toBe(false);
    expect(isValidGln("1234567890124")).toBe(false); // wrong check digit
    expect(isValidGln("abcdefghijklm")).toBe(false);
  });

  it("glnCheckDigit implements the GS1 mod-10 weight rule (3/1 from the right)", () => {
    // Hand-computed: base "123456789012" → weights 3,1,3,1,... from the right
    // 2*3 + 1*1 + 0*3 + 9*1 + 8*3 + 7*1 + 6*3 + 5*1 + 4*3 + 3*1 + 2*3 + 1*1
    // = 6 + 1 + 0 + 9 + 24 + 7 + 18 + 5 + 12 + 3 + 6 + 1 = 92 → 10-(92%10)=8
    expect(glnCheckDigit("123456789012")).toBe(8);
    // glnFromId always emits a self-validating GLN (base + correct check digit)
    const gln = glnFromId("farm-9");
    expect(gln.slice(0, 12) + String(glnCheckDigit(gln.slice(0, 12)))).toBe(gln);
  });
});
