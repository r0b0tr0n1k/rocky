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
  /**
   * Delivers the email-verification message on behalf of Better Auth.
   * Implemented by the caller (apps/api) via @rocky/email. Defaults to a no-op.
   */
  sendVerificationEmail?: (params: {
    user: { id: string; email: string; name?: string; [key: string]: unknown };
    url: string;
    token: string;
  }) => Promise<void>;
  /**
   * Called after a user's email is successfully verified. Implemented by the
   * caller (apps/api) for audit logging. Defaults to a no-op.
   */
  afterEmailVerification?: (
    user: { id: string; email: string; name?: string; [key: string]: unknown },
    request?: unknown,
  ) => Promise<void>;
  /**
   * Called when a sign-up attempt uses an email that already exists. Implemented
   * by the caller (apps/api) to notify the existing user via @rocky/email.
   * Defaults to a no-op.
   */
  onExistingUserSignUp?: (
    data: { user: { id: string; email: string; name?: string; [key: string]: unknown } },
    request?: unknown,
  ) => Promise<void>;
  /**
   * Session lifetime / freshness / cookie-cache policy. Injected by the caller
   * (apps/api) from env so the singleton stays the owner and apps/api the env owner.
   * @default expiresIn 7d, updateAge 1d, freshAge 15min, cookieCache compact 300s
   */
  session?: AuthSessionConfig;
}

/** Session configuration for the Better Auth singleton. */
export interface AuthSessionConfig {
  /** Session token lifetime in seconds (sliding via updateAge). @default 7 days */
  expiresIn?: number;
  /** How often the session expiration is refreshed, in seconds. @default 1 day */
  updateAge?: number;
  /**
   * Freshness window in seconds for step-up on privileged mutations. A session is
   * "fresh" only if issued within this window (measured vs `createdAt`, NOT last
   * activity). The RequireFreshSessionMiddleware enforces this. @default 15 minutes
   */
  freshAge?: number;
  /** Short-lived signed cookie cache for session data. */
  cookieCache?: {
    enabled?: boolean;
    /** Cache duration in seconds. @default 300 (5 min, matches PrincipalCache TTL) */
    maxAge?: number;
    /** Encoding strategy. @default "compact" */
    strategy?: "compact" | "jwt" | "jwe";
  };
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
        onExistingUserSignUp: config.onExistingUserSignUp ?? (async () => {}),
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: config.sendVerificationEmail ?? (async () => {}),
        afterEmailVerification: config.afterEmailVerification ?? (async () => {}),
      },
      // ── Session policy (env-driven from apps/api) ──
      // freshAge default 15min: a privileged mutation requires a session issued
      // within this window (vs createdAt, not last activity). cookieCache compact
      // 300s mirrors the 5-min PrincipalCache revocation lag.
      session: {
        expiresIn: config.session?.expiresIn ?? 60 * 60 * 24 * 7,
        updateAge: config.session?.updateAge ?? 60 * 60 * 24,
        freshAge: config.session?.freshAge ?? 60 * 15,
        cookieCache: {
          enabled: config.session?.cookieCache?.enabled ?? true,
          maxAge: config.session?.cookieCache?.maxAge ?? 300,
          strategy: config.session?.cookieCache?.strategy ?? "compact",
        },
      },
      plugins: [admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles }), expo()],
    }) as unknown as ReturnType<typeof betterAuth>;

    return Auth.instance;
  }
}
