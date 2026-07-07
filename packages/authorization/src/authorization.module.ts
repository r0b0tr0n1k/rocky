import { Global, Module } from "@nestjs/common";
import { PolicyEngine } from "./policies/engine.js";
import { PrincipalCache } from "./principal/principal.cache.js";
import { PrincipalResolver } from "./principal/principal.resolver.js";

/**
 * Authorization module — PrincipalResolver requires PrincipalCache.
 * Constructed via useFactory because esbuild (tsx) does not emit
 * design:paramtypes metadata needed for implicit constructor injection.
 */
@Global()
@Module({
  providers: [
    PrincipalCache,
    PolicyEngine,
    {
      provide: PrincipalResolver,
      useFactory: (cache: PrincipalCache) => new PrincipalResolver(cache),
      inject: [PrincipalCache],
    },
  ],
  exports: [PrincipalCache, PrincipalResolver, PolicyEngine],
})
export class AuthorizationModule {}
