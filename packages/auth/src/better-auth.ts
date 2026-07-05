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
  SUPER_ADMIN: _ac.newRole({ user: ["create","list","set-role","ban","impersonate","impersonate-admins","delete","set-password","set-email","get","update"], session: ["list","revoke","delete"] }),
  VD_ADMIN: _ac.newRole({ user: ["create","list","set-role","ban","impersonate","delete","set-password","set-email","get","update"], session: ["list","revoke"] }),
  VD_STAFF: _ac.newRole({ user: ["list","get","update"], session: ["list"] }),
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
        generateId: false,
      },
      user: {
        modelName: "auth_user",
      },
      session: {
        modelName: "auth_session",
        fields: {
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
          userId: "user_id",
        },
      },
      account: {
        modelName: "auth_account",
        fields: {
          accountId: "account_id",
          providerId: "provider_id",
          userId: "user_id",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          idToken: "id_token",
          accessTokenExpiresAt: "access_token_expires_at",
          refreshTokenExpiresAt: "refresh_token_expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      verification: {
        modelName: "auth_verification",
        fields: {
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      experimental: {
        joins: true,
      },
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({
          user,
          url,
        }: {
          user: { id: string; email: string };
          url: string;
          token?: string;
        }) => {
          console.info("Password reset requested", { userId: user.id, url });
        },
      },
      plugins: [admin({ adminRoles: ["SUPER_ADMIN"], roles: _authRoles }), expo()],
    }) as unknown as ReturnType<typeof betterAuth>;

    console.info("Better Auth initialized");
    return Auth.instance;
  }
}
