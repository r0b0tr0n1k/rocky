import { Global, Module } from "@nestjs/common";
import { DatabaseProvider } from "@rocky/database";
import { SystemRepository, SystemService } from "@rocky/domains-system";
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
    {
      provide: SystemService,
      useFactory: (dbp: DatabaseProvider) => new SystemService(new SystemRepository(dbp)),
      inject: [DatabaseProvider],
    },
    {
      provide: PolicyEngine,
      useFactory: (system: SystemService) => new PolicyEngine(system),
      inject: [SystemService],
    },
    {
      provide: PrincipalResolver,
      useFactory: (cache: PrincipalCache) => new PrincipalResolver(cache),
      inject: [PrincipalCache],
    },
  ],
  exports: [PrincipalCache, PrincipalResolver, PolicyEngine, SystemService],
})
export class AuthorizationModule {}
