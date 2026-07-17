import { describe, expect, it, vi } from "vitest";
import { AuthResolver } from "./auth.resolver.js";
import type { AuthResult } from "./better-auth.js";

// Minimal fake of the Better Auth instance surface AuthResolver touches.
// AuthResolver.resolve is transport-agnostic: it only calls
// `auth.api.getSession({ headers })` and maps the result to an AuthResult.
function fakeAuth(getSession: (args: { headers: Headers }) => Promise<unknown>) {
  return { api: { getSession: vi.fn(getSession) } } as any;
}

const SESSION = { id: "sess_1", userId: "u1" } as any;
const USER = { id: "u1", email: "a@b.c", name: "n" } as any;

describe("AuthResolver.resolve", () => {
  it("returns null WITHOUT calling getSession when the cookie is empty", async () => {
    const auth = fakeAuth(async () => {
      throw new Error("getSession must not be called for an empty cookie");
    });
    const result = await AuthResolver.resolve(auth, "");
    expect(result).toBeNull();
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it("calls getSession with a Headers carrying the cookie and maps {session,user}", async () => {
    const auth = fakeAuth(async () => ({ session: SESSION, user: USER }));
    const result = await AuthResolver.resolve(auth, "rocky_session=abc");

    expect(result).toEqual({ session: SESSION, user: USER } satisfies AuthResult);
    expect(auth.api.getSession).toHaveBeenCalledTimes(1);
    const [arg] = auth.api.getSession.mock.calls[0] as [{ headers: Headers }];
    expect(arg.headers).toBeInstanceOf(Headers);
    expect(arg.headers.get("cookie")).toBe("rocky_session=abc");
  });

  it("returns null when getSession yields no session", async () => {
    const auth = fakeAuth(async () => null);
    const result = await AuthResolver.resolve(auth, "rocky_session=abc");
    expect(result).toBeNull();
  });
});
