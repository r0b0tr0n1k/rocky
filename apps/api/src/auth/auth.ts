import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { customSession } from "better-auth/plugins";
import { db } from "@rocky/database";
import { user, session, account, verification } from "@rocky/database/schema/auth";
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
            // Enriches session with roles, permissions, org context for RLS
            const smUser = (await (db.query! as any).users.findFirst({
              where: { authUserId: authUser.id } as any,
              with: {
                organization: true,
                roles: {
                  with: {
                    role: {
                      with: {
                        permissions: {
                          with: { permission: true },
                        },
                      },
                    },
                  },
                },
              },
            })) as unknown as {
              id: string;
              username: string | null;
              language: string | null;
              status: string | null;
              organizationId: string | null;
              organization?: { districtId?: string | null } | null;
              roles?: Array<{
                role?: {
                  name: string;
                  permissions?: Array<{
                    permission?: { resource: string; action: string } | null;
                  } | null> | null;
                } | null;
              } | null> | null;
            } | null;

            const permissionList =
              smUser?.roles
                ?.filter((ur): ur is NonNullable<typeof ur> => ur != null)
                .flatMap(
                  (ur) =>
                    ur.role?.permissions
                      ?.filter((rp): rp is NonNullable<typeof rp> => rp != null)
                      .map((rp) => `${rp.permission?.resource}:${rp.permission?.action}`) ?? [],
                )
                .filter((s): s is string => Boolean(s)) ?? [];

            // Role names for RLS: ["VD_STAFF", "FARMER"]
            const roleNames: string[] =
              smUser?.roles
                ?.filter((ur): ur is NonNullable<typeof ur> => ur != null)
                .map((ur) => ur.role?.name)
                .filter((s): s is string => Boolean(s)) ?? [];

            return {
              session,
              user: {
                // Better Auth core fields
                ...authUser,
                // SM domain identity (RLS middleware consumes these)
                smUserId: smUser?.id ?? null,
                role: roleNames[0] ?? "FARMER",
                roles: roleNames,
                permissions: permissionList,
                organizationId: smUser?.organizationId ?? null,
                districtId: smUser?.organization?.districtId ?? null,
                // Audit metadata
                username: smUser?.username ?? null,
                language: smUser?.language ?? "MK",
                status: smUser?.status ?? "ACTIVE",
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
