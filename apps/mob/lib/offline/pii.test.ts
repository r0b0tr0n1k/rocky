import { test } from "node:test";
import assert from "node:assert/strict";
import { maskValue, redactRecord, hasPii } from "./pii";

test("maskValue preserves the last two characters", () => {
  assert.equal(maskValue("Janez Novak"), "\u2022".repeat(9) + "ak"); // 11 chars -> 9 bullets + "ak"
  assert.equal(maskValue("AB"), "\u2022\u2022");
  assert.equal(maskValue(""), "");
  assert.equal(maskValue(null), "");
  assert.equal(maskValue(undefined), "");
});

test("redactRecord masks only the named PII columns", () => {
  const rec = { firstName: "Janez", lastName: "Novak", vatNumber: "MK1", farmName: "Sunny" };
  const red = redactRecord(rec, ["firstName", "lastName", "vatNumber"]);
  assert.equal(red.firstName, maskValue("Janez"));
  assert.equal(red.lastName, maskValue("Novak"));
  assert.equal(red.vatNumber, maskValue("MK1"));
  assert.equal(red.farmName, "Sunny"); // not PII -> untouched
  assert.notEqual(red.firstName, "Janez");
});

test("redactRecord does not mutate its input", () => {
  const rec = { firstName: "Janez" };
  redactRecord(rec, ["firstName"]);
  assert.equal(rec.firstName, "Janez");
});

test("hasPii reflects the descriptor", () => {
  assert.equal(hasPii({ firstName: "x" }, ["firstName"]), true);
  assert.equal(hasPii({ farmName: "y" }, ["firstName"]), false);
});
