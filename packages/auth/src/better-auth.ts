// ── Better Auth Instance ──
// Authentication provider for all Rocky apps.
// Singleton — one Better Auth server powers the entire monorepo.
//
// Identity boundary: This file knows ONLY about auth tables and session management.
// It does NOT import SM users, RBAC, organizations, or any domain entities.
// The `customSession` enrichment has been split:
//   - Identity: what Better Auth provides (session, user) — stays here
//   - Authorization: SM profile, roles, permissions — moved to PrincipalResolver

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { db } from "@rocky/database";
import { account, session, user, verification } from "@rocky/database/schema/auth";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export interface AuthConfig {
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  /**
   * Shared parent cookie domain for cross-subdomain sessions, e.g. `.rocky.company.com`.
   * When set, Better Auth enables `crossSubDomainCookies` so the session cookie is
   * visible across `api.`, `admin.`, and `docs.` subdomains (required for deployments
   * where the app lives under a tertiary/subdomain, not the registered apex).
   * Leave undefined for single-host / localhost dev (no cross-subdomain cookies).
   */
  cookieDomain?: string;
  /**
   * Delivers the password-reset email on behalf of Better Auth.
   * Implemented by the caller (apps/api) via @rocky/email so this package
   * stays free of any email-transport dependency. Defaults to a no-op.
   */
  sendResetPassword?: (params: {
    user: { id: string; email: string; name?: string; [key: string]: unknown };
    url: string;
    token: string;
  }) => Promise<void>;
}

export type AuthResult = {
  session: {
    id: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    token: string;
  } | null;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    phone?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
} | null;

// ── Role definitions for Better Auth admin plugin ──
const _ac = createAccessControl(defaultStatements);
const _authRoles = {
  SUPER_ADMIN: _ac.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "impersonate-admins",
      "delete",
      "set-password",
      "set-email",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
  }),
  VD_ADMIN: _ac.newRole({
    user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "set-email", "get", "update"],
    session: ["list", "revoke"],
  }),
  VD_STAFF: _ac.newRole({ user: ["list", "get", "update"], session: ["list"] }),
  VETERINARIAN: _ac.newRole({ user: ["get"], session: [] }),
  TECHNICIAN: _ac.newRole({ user: ["get"], session: [] }),
  FARMER: _ac.newRole({ user: [], session: [] }),
  SLAUGHTERHOUSE_OP: _ac.newRole({ user: [], session: [] }),
  MARKET_OP: _ac.newRole({ user: [], session: [] }),
  SUPPLIER: _ac.newRole({ user: [], session: [] }),
};

// biome-ignore lint/complexity/noStaticOnlyClass: OK Biome
export class Auth {
  private static instance: ReturnType<typeof betterAuth>;

  static getInstance(config: AuthConfig) {
    if (Auth.instance) return Auth.instance;

    Auth.instance = betterAuth({
      baseURL: config.baseURL,
      secret: config.secret,
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
      }),
      trustedOrigins: config.trustedOrigins,
      advanced: {
        cookiePrefix: "rocky",
        // Cross-subdomain sessions: only when an explicit shared parent domain is
        // configured (tertiary/subdomain deployments). Better Auth does NOT derive
        // the parent from baseURL — it would otherwise pin the cookie to the raw
        // api hostname and break sharing with admin./docs. subdomains.
        ...(config.cookieDomain
          ? {
              crossSubDomainCookies: {
                enabled: true,
                domain: config.cookieDomain,
              },
            }
          : {}),
      },
      emailAndPassword: {
        enabled: true,
        sendResetPassword: config.sendResetPassword ?? (async () => {}),
      },
      plugins: [admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles }), expo()],
    }) as unknown as ReturnType<typeof betterAuth>;

    return Auth.instance;
  }
}
