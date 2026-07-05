// ── @rocky/auth ──
// Authentication package — Better Auth instance, session resolution, auth client.
//
// Identity boundary: This package knows ONLY about auth tables and session management.
// It does NOT import SM users, RBAC, organizations, or any domain entities.
//
// What crosses the boundary to authorization:
//   AuthResult → PrincipalResolver receives only the identity ID

export { AUTH_CONFIG, AUTH_INSTANCE, AuthModule } from "./auth.module.js";
export { AuthResolver } from "./auth.resolver.js";
export { Auth, type AuthConfig, type AuthResult } from "./better-auth.js";
export { createRockyAuthClient } from "./client.js";

