import { Injectable } from "@nestjs/common";
import type { AppContext } from "@rocky/trpc/context";

@Injectable()
export class AuthOnlyMiddleware {
  async before(ctx: AppContext): Promise<void> {
    // Using dynamic import to avoid circular deps with TRPCError
    const { TRPCError } = await import("@trpc/server");
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }
  }
}
