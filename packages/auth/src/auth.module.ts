import { type DynamicModule, Global, Module } from "@nestjs/common";
import { Auth, type AuthConfig } from "./better-auth.js";

export const AUTH_CONFIG = "AUTH_CONFIG";
export const AUTH_INSTANCE = "AUTH_INSTANCE";

@Global()
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: OK Biome
export class AuthModule {
  /**
   * Register the Auth module with application configuration.
   *
   * Auth.getInstance() is idempotent — calling it multiple times with
   * the same config returns the same singleton. This allows both
   * this module and any direct callers to share one instance.
   */
  static register(config: AuthConfig): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      providers: [
        {
          provide: AUTH_CONFIG,
          useValue: config,
        },
        {
          provide: AUTH_INSTANCE,
          useFactory: () => Auth.getInstance(config),
        },
      ],
      exports: [AUTH_CONFIG, AUTH_INSTANCE],
    };
  }
}
