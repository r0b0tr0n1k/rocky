import type { AuthResult } from "./better-auth.js";

/**
 * Resolve authentication from an incoming HTTP request.
 *
 * Transport-agnostic: receives cookie header, returns AuthResult.
 * No dependency on Express, tRPC, or NestJS request objects.
 *
 * Usage:
 * ```typescript
 * const result = await AuthResolver.resolve(auth, req.headers.get("cookie") ?? "");
 * if (!result) {
 *   // anonymous request
 * }
 * ```
 */

// biome-ignore lint/complexity/noStaticOnlyClass: OK Biome
export class AuthResolver {
  /**
   * Resolve Better Auth session from a cookie header.
   * Returns `null` for unauthenticated requests.
   */
  static async resolve(
    auth: ReturnType<typeof import("./better-auth.js").Auth.getInstance>,
    cookieHeader: string,
  ): Promise<AuthResult> {
    if (!cookieHeader) return null;

    const result = await auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
    });

    if (!result) return null;

    return {
      session: result.session,
      user: result.user,
    } satisfies AuthResult;
  }
}
