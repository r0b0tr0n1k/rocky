import { Global, Module } from "@nestjs/common";
import { Auth } from "./auth.js";

export const AUTH_INSTANCE = "AUTH_INSTANCE";

@Global()
@Module({
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: () => Auth.getInstance(),
    },
  ],
  exports: [AUTH_INSTANCE],
})
export class AuthCoreModule {}
