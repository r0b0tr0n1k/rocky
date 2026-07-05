// ── Auth Core Module ──
// Thin wrapper that registers @rocky/auth's AuthModule with app config.
// Export AUTH_INSTANCE for DI injection in app middlewares.

import { Global, Module } from "@nestjs/common";
import { AUTH_INSTANCE, AuthModule } from "@rocky/auth";
import { authConfig } from "./auth.js";

export { AUTH_INSTANCE };

@Global()
@Module({
  imports: [AuthModule.register(authConfig)],
})
export class AuthCoreModule {}
