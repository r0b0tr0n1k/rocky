// Session type augmentation for customSession plugin enrichment.
// The server's customSession plugin adds roles, permissions, orgId, language, status
// to the session.user object. This declaration extends the better-auth Session type.

declare module "better-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
      // Enriched by customSession plugin (see packages/auth/src/better-auth.ts)
      roles?: string[];
      permissions?: string[];
      orgId?: string | null;
      language?: string | null;
      status?: string;
    };
  }
}
