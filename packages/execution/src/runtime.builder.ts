// ── RuntimeBuilder ──
// Composes the runtime context from request and principal information.
//
// Resolution hierarchy:
//   Accept-Language header
//     ↓ (fallback)
//   Principal profile language (locale claim)
//     ↓ (fallback)
//   Organization default
//     ↓ (fallback)
//   System default ("MK")

import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Principal } from "@rocky/authorization";
import type { RequestContext, RuntimeContext } from "./execution-context.js";

@Injectable()
export class RuntimeBuilder {
  /**
   * Build runtime context from request and principal.
   *
   * @param request - Incoming request context
   * @param principal - Resolved principal
   * @param tenant - Optional tenant header value
   * @returns Immutable runtime context
   */
  resolve(request: RequestContext, principal: Principal, tenant?: string | null): RuntimeContext {
    return {
      traceId: randomUUID(),
      requestId: request.headers?.get?.("x-request-id") ?? randomUUID(),
      locale: this.resolveLocale(request, principal),
      tenant: tenant ?? request.headers?.get?.("x-tenant") ?? null,
      clock: new Date(),
    };
  }

  private resolveLocale(request: RequestContext, principal: Principal): string {
    return this.fromAcceptLanguage(request) ?? principal.getClaim<string>("locale") ?? "MK";
  }

  private fromAcceptLanguage(request: RequestContext): string | null {
    const acceptLanguage = request.headers?.get?.("accept-language");
    if (!acceptLanguage) return null;

    // Parse first language tag (e.g. "en-US,en;q=0.9" → "en-US")
    const first = acceptLanguage.split(",")[0]?.trim();
    if (!first) return null;

    // Extract language code (e.g. "en-US" → "en", "MK" → "MK")
    return first.split("-")[0] ?? null;
  }
}
