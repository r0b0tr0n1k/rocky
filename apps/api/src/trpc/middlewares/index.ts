export { ExecutionMiddleware } from "./execution.middleware.js";
export { LoggingMiddleware } from "./logging.middleware.js";
/** @deprecated - removed in Phase 4. Use PolicyResolver instead. */
export { createPermissionGuard, PermissionGuard } from "./permission.guard.js";
export { PolicyResolver } from "./policy.resolver.js";
/** @deprecated - removed in Phase 4. Use @Policy({ authenticated: true }) instead. */
export { PrincipalGuard } from "./principal.guard.js";
/** @deprecated - removed in Phase 4. Only kept for import safety. */
export { ProtectedMiddleware } from "./protected.middleware.js";
/** @deprecated - removed in Phase 4. RLS is handled by ExecutionPipeline now. */
export { RLSMiddleware } from "./rls.middleware.js";
/** @deprecated - removed in Phase 4. Use PolicyResolver + ABAC instead. */
export { ScopeGuard } from "./scope.guard.js";
