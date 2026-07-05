// ── Principal — Canonical Runtime Actor ──
// The ONLY auth-related object business code touches.
// Business code receives `Principal` — never Better Auth, never RBAC, never SM user.
//
// Principal survives ANY infrastructure change:
//   - Switch Better Auth → Keycloak: Principal unchanged
//   - Switch RBAC → OpenFGA/Cedar: Principal.hasPermission() unchanged
//   - Rename sm.users → app_users: Principal.username unchanged

/**
 * Action to authorize — the policy engine resolves actions to implementation.
 * Routers only declare actions, never permissions.
 *
 * @example `@Policy({ action: "animal:create" })`
 */
export type PolicyAction = string;

/**
 * Access level computed from role hierarchy and scoping rules.
 */
export type AccessLevel = "all" | "organization" | "own";

/**
 * Organization context within which the principal operates.
 */
export interface OrganizationContext {
  readonly id: string;
}

/**
 * Principal — the canonical runtime actor.
 *
 * Immutable value object. Created once per request by PrincipalResolver.
 * Received by domain services, policies, and routers.
 */
export class Principal {
  // ── Core identity ──
  readonly id: string;
  readonly username: string;

  // ── Roles & Permissions ──
  readonly roles: ReadonlyArray<string>;
  readonly permissions: ReadonlyArray<string>;

  // ── Organization ──
  readonly organization: OrganizationContext | null;

  // ── Access ──
  readonly accessLevel: AccessLevel;

  // ── Claims (immutable, extensible key-value store) ──
  readonly claims: Readonly<Record<string, unknown>>;

  private constructor(params: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
    organization: OrganizationContext | null;
    accessLevel: AccessLevel;
    claims: Record<string, unknown>;
  }) {
    this.id = params.id;
    this.username = params.username;
    this.roles = Object.freeze([...params.roles]);
    this.permissions = Object.freeze([...params.permissions]);
    this.organization = params.organization;
    this.accessLevel = params.accessLevel;
    this.claims = Object.freeze({ ...params.claims });
  }

  /**
   * Create a new Principal instance. Immutable by construction.
   */
  static create(params: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
    organization: OrganizationContext | null;
    accessLevel: AccessLevel;
    claims?: Record<string, unknown>;
  }): Principal {
    return new Principal({
      ...params,
      claims: params.claims ?? {},
    });
  }

  // ── Query methods ──

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  isAdmin(): boolean {
    return this.roles.includes("SUPER_ADMIN");
  }

  getClaim<T>(key: string): T | undefined {
    return this.claims[key] as T | undefined;
  }
}
