import { describe, expect, it } from "vitest";
import { DocumentService } from "./document.service.js";
describe("p3", () => {
  it("imports", () => {
    expect(typeof DocumentService).toBe("function");
  });
});
