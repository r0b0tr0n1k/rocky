import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { customSession } from "better-auth/plugins";
import { db } from "@prasici/database";
import { user, session, account, verification } from "@prasici/database/schema/auth";
import { appConfig } from "#/config";
import { logger } from "#/log";

export class Auth {
  private static instance: ReturnType<typeof betterAuth>;

  static getInstance() {
    if (this.instance) return this.instance;

    this.instance = betterAuth({
      baseURL: appConfig.auth.baseUrl,
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
      }),
      trustedOrigins: appConfig.trustedOrigins,
      advanced: {
        cookiePrefix: "yourcompany",
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
      socialProviders: {},
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }) => {
          logger.info("Password reset requested", { userId: user.id, url });
        },
      },
      plugins: [
        expo(),
        customSession(async ({ user, session }) => {
          return { user, session };
        }),
      ],
    });

    logger.info("Better Auth initialized");
    return this.instance;
  }
}
