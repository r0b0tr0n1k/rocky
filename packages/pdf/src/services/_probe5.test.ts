import { describe, expect, it } from "vitest";
function Dec(_target: unknown): unknown {
  return _target;
}
@Dec()
class Foo {
  x = 1;
}
describe("p5", () => {
  it("decorator", () => {
    expect(Foo).toBeDefined();
  });
});
