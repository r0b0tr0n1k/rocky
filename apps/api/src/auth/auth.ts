import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { admin, customSession } from "better-auth/plugins";
import { db } from "@rocky/database";
import { user, session, account, verification } from "@rocky/database/schema/auth";
import {
  users as smUsers,
  roles,
  userRoles as smUserRoles,
  rolePermissions,
  permissions as permTable,
} from "@rocky/database";
import { eq } from "drizzle-orm";
import { appConfig } from "#/config";
import { logger } from "#/log";

export class Auth {
  private static instance: ReturnType<typeof betterAuth>;

  static getInstance() {
    if (Auth.instance) return Auth.instance;

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      throw new Error("BETTER_AUTH_SECRET environment variable is not set");
    }

    Auth.instance = betterAuth({
      baseURL: appConfig.auth.baseUrl,
      secret,
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
      }),
      trustedOrigins: appConfig.trustedOrigins,
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
          logger.info("Password reset requested", { userId: user.id, url });
        },
      },
      plugins: [
        admin({ adminRoles: ["SUPER_ADMIN"] }),
        expo(),
        customSession(
          async ({
            user: authUser,
            session,
          }): Promise<{
            session: typeof session;
            user: Record<string, unknown>;
          }> => {
            // Bridge Better Auth identity → SM domain identity
            // Uses typed db.select() instead of Drizzle RC's relation queries

            // Step 1: Find SM user
            const [smUserRow] = await db.select().from(smUsers).where(eq(smUsers.authUserId, authUser.id)).limit(1);

            let smUserId: string | null = null;

            let roleNames: string[] = [];
            let permissionList: string[] = [];

            if (smUserRow) {
              smUserId = smUserRow.id;

              // Step 2: Org info available via smUserRow.organizationId directly

              // Step 3: Fetch user roles with permissions via explicit joins
              const userRoles = await db
                .select({
                  roleName: roles.name,
                  permResource: permTable.resource,
                  permAction: permTable.action,
                })
                .from(smUserRoles)
                .where(eq(smUserRoles.userId, smUserRow.id))
                .leftJoin(roles, eq(smUserRoles.roleId, roles.id))
                .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
                .leftJoin(permTable, eq(rolePermissions.permissionId, permTable.id));

              // Collect unique role names
              roleNames = [...new Set(userRoles.map((r) => r.roleName).filter((n): n is string => n != null))];

              // Collect unique permissions
              permissionList = [
                ...new Set(
                  userRoles
                    .map((r) => (r.permResource && r.permAction ? `${r.permResource}:${r.permAction}` : null))
                    .filter((s): s is string => s != null),
                ),
              ];
            }

            return {
              session,
              user: {
                ...authUser,
                smUserId: smUserId,
                role: roleNames[0] ?? "FARMER",
                roles: roleNames,
                permissions: permissionList,
                organizationId: smUserRow?.organizationId ?? null,

                username: smUserRow?.username ?? null,
                language: smUserRow?.language ?? "MK",
                status: smUserRow?.status ?? "ACTIVE",
              },
            };
          },
        ),
      ],
    }) as unknown as ReturnType<typeof betterAuth>;

    logger.info("Better Auth initialized");
    return Auth.instance;
  }
}

export const auth = Auth.getInstance();
