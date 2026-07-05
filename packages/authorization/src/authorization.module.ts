import { Global, Module } from "@nestjs/common";
import { PolicyEngine } from "./policies/engine.js";
import { PrincipalResolver } from "./principal/principal.resolver.js";

@Global()
@Module({
  providers: [PrincipalResolver, PolicyEngine],
  exports: [PrincipalResolver, PolicyEngine],
})
export class AuthorizationModule { }
