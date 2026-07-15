import { z } from "zod";

const dbConfigSchema = z.object({
  host: z.string(),
  user: z.string(),
  password: z.string(),
  name: z.string(),
  port: z.number().optional(),
});

const apiConfigSchema = z.object({
  env: z.enum(["dev", "production", "test", "staging"]),
  db: dbConfigSchema,
  port: z.number().min(3000).max(65535),
  version: z.string().min(1, "VERSION is required").default("dev"),
  requestLogging: z.boolean().optional().default(false),
  baseServiceUrl: z.string().min(1, "BASE_SERVICE_URL is required"),
  trustedOrigins: z.array(z.string()).min(1, "TRUSTED_ORIGINS is required"),
  cors: z.object({
    origins: z.array(z.string()).min(1, "CORS_ORIGINS is required"),
  }),
  auth: z.object({
    baseUrl: z.string().min(1, "AUTH_BASE_URL is required"),
    google: z
      .object({
        clientId: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
        clientSecret: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      })
      .optional(),
  }),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export { apiConfigSchema };

// Port resolution: API_PORT (from .env.worktree) > PORT (from .env) > 8080
const apiPort = Number(process.env.API_PORT || process.env.PORT || 8080);
const webPort = process.env.WEB_PORT || "4000";
// The DB connection is a SINGLE parameter: DATABASE_URL. Derive the config
// object from it so there is exactly one source of truth (no PG_HOST/PG_PORT/
// PG_USER/PG_PASS scattering — Postgres only understands the connection string).
const databaseUrlRaw = process.env.DATABASE_URL;
if (!databaseUrlRaw) {
  throw new Error("DATABASE_URL is required");
}
let dbUrl: URL;
try {
  dbUrl = new URL(databaseUrlRaw);
} catch {
  throw new Error(`DATABASE_URL is not a valid connection string: ${databaseUrlRaw}`);
}
const baseServiceUrl = process.env.BASE_SERVICE_URL || `http://localhost:${apiPort}`;
const webOrigin = `http://localhost:${webPort}`;

export const appConfig = apiConfigSchema.parse({
  port: apiPort,
  version: process.env.VERSION,
  env: process.env.ENVIRONMENT,
  requestLogging: process.env.REQUEST_LOGGING === "true",
  db: {
    host: dbUrl.hostname,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    name: dbUrl.pathname.replace(/^\//, ""),
    port: dbUrl.port ? Number(dbUrl.port) : 5432,
  },
  baseServiceUrl,
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [webOrigin],
  },
  auth: {
    baseUrl: baseServiceUrl,
    google:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(",") : [webOrigin, "mobile://"],
});

export const isDev = appConfig.env === "dev";
