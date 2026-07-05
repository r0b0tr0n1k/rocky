// ── @rocky/authorization ──
/** biome-ignore-all assist/source/organizeImports: Biome sorting nah */
// Authorization package — Principal, RBAC, policy engine.
//
// Boundary: receives only Principal (not Better Auth, not SM users).
// Business code touches ONLY Principal.

export { Principal, type AccessLevel, type OrganizationContext, type PolicyAction } from "./principal/principal.js";
export { PrincipalResolver } from "./principal/principal.resolver.js";
export { ANONYMOUS_PRINCIPAL, SYSTEM_PRINCIPAL } from "./principal/principals.js";

export { AuthorizationModule } from "./authorization.module.js";
export { PolicyEngine, type PolicyDecision } from "./policies/engine.js";
export { getPolicyMetadata, Policy, POLICY_METADATA_KEY, type PolicyMetadata } from "./policies/policy.decorator.js";
export { PolicyRegistry } from "./policies/policy.registry.js";
export { RegisterPolicy } from "./policies/register-policy.decorator.js";

