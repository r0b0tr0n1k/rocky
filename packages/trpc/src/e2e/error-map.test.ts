import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { err, ok } from "neverthrow";
import { createResultUnwrapper } from "../index.js";
import { ANIMAL_TRPC_ERROR_MAP } from "@rocky/validators/errors";

// Local domain errors that mimic the real animal errors: they carry a `.code`
// string consumed by the error map. We test the MAP mechanism, not the error
// classes themselves (those live in the domain services).
class AnimalNotFoundError extends Error {
  code = "ANIMAL_NOT_FOUND";
  constructor(message = "animal missing") {
    super(message);
    this.name = "AnimalNotFoundError";
  }
}

class AnimalForbiddenError extends Error {
  code = "ANIMAL_FORBIDDEN";
  constructor(message = "forbidden") {
    super(message);
    this.name = "AnimalForbiddenError";
  }
}

describe("createResultUnwrapper -> TRPCError mapping", () => {
  const unwrap = createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP);

  it("returns the value for an ok result", () => {
    expect(unwrap(ok({ id: "abc" }))).toEqual({ id: "abc" });
  });

  it("maps ANIMAL_NOT_FOUND -> NOT_FOUND", () => {
    let caught: unknown;
    try {
      unwrap(err(new AnimalNotFoundError()));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TRPCError);
    expect((caught as TRPCError).code).toBe("NOT_FOUND");
  });

  it("maps ANIMAL_FORBIDDEN -> FORBIDDEN", () => {
    let caught: unknown;
    try {
      unwrap(err(new AnimalForbiddenError()));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TRPCError);
    expect((caught as TRPCError).code).toBe("FORBIDDEN");
  });
});
