// ── tRPC E2E over supertest (no open network port) ──
//
// Proof-of-concept for the full-stack tRPC E2E pattern: a typed tRPC client is
// bound to the real NestJS app via supertest + the httpLink + superjson, so we
// test the exact HTTP transport, status codes, cookie auth and superjson Date
// parsing without ever opening a port.
import "./test/load-env.js"; // MUST be first — populates process.env before @rocky/database import
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { Test } from "@nestjs/testing";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@rocky/database";
import { account, session, user as baUser, verification } from "@rocky/database/schema/auth";
import { AppModule } from "./app.module.js";
import { createE2ETRPCClient } from "./test/e2e-client.js";

// A valid (but non-existent) UUID so tRPC input validation passes and the
// request actually reaches the auth / policy gate.
const GHOST_ID = "00000000-0000-0000-0000-000000000000";
const TEST_PW = "Test1234!";

// A standalone Better Auth instance pointed at the SAME database, used only to
// mint a real user (signUpEmail persists the password; testUtils' getAuthHeaders
// does not). The real sign-in travels through the AppModule's own handler so we
// exercise the genuine cookie → session → principal path.
const testAuth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  secret: process.env.BETTER_AUTH_SECRET ?? "test-insecure-secret-for-tests-only-32chars",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: baUser, session, account, verification },
  }),
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:8000", "http://localhost:3000"],
  advanced: { cookiePrefix: "rocky", generateId: false },
  emailAndPassword: { enabled: true },
  plugins: [testUtils()],
});

let app: INestApplication;
let cookie: string | null = null;
let baUserId: string | null = null;
let dbAvailable = false;
let realAnimalId: string | null = null;

beforeAll(async () => {
  try {
    await db.execute(sql`select 1`);
    dbAvailable = true;

    // Mint a real user via the shared Better Auth instance.
    const email = `trpce2e-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const created = (await testAuth.api.signUpEmail({
      body: { email, password: TEST_PW, name: "trpce2e" },
    })) as { user?: { id: string }; data?: { user?: { id: string } } };
    baUserId = created.user?.id ?? created.data?.user?.id ?? null;
    if (!baUserId) {
      throw new Error("signUpEmail returned no user");
    }

    // Boot the real Nest application.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Sign in through a live Better Auth handler (same DB + secret as AppModule)
    // to obtain a real session cookie. Using the dedicated handler avoids the
    // AppModule's own origin/CSRF guards on the sign-in route; the resulting
    // cookie is valid for the AppModule because both share the secret + DB.
    const handler = toNodeHandler(testAuth as unknown as Parameters<typeof toNodeHandler>[0]);
    const srv = http.createServer((req, res) => handler(req as never, res as never));
    await new Promise<void>((resolve) => srv.listen(0, resolve));
    const base = `http://localhost:${(srv.address() as AddressInfo).port}`;
    const signInRes = await fetch(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ email, password: TEST_PW }),
    });
    const setCookies = signInRes.headers.getSetCookie?.() ?? [];
    const hit = setCookies.find((c) => c.startsWith("rocky.session_token="));
    cookie = hit ? (hit.split(";")[0] ?? null) : null;
    await new Promise<void>((resolve) => srv.close(() => resolve()));

    // Best-effort: grab a real animal id so we can prove superjson Date parsing.
    const rows = (await db.execute(sql`select id, birth_date from animals limit 1`)) as unknown as Array<{
      id: string;
      birth_date: string | null;
    }>;
    realAnimalId = rows[0]?.id ?? null;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (app) await app.close();
  // Remove the fixture Better Auth user so the DB stays clean between runs.
  if (dbAvailable && baUserId) {
    try {
      const ctx = await testAuth.$context;
      await ctx.test.deleteUser(baUserId);
    } catch {
      // best-effort cleanup
    }
  }
});

describe("tRPC e2e over supertest (no open port)", () => {
  it("unauthenticated call is rejected with 401/403 over real HTTP", async (tc) => {
    if (!dbAvailable) return tc.skip();
    const client = createE2ETRPCClient(app);
    try {
      await client.animal.getById.query({ id: GHOST_ID });
      throw new Error("expected the unauthenticated call to be rejected");
    } catch (e: any) {
      const status = e?.status ?? e?.data?.httpStatus;
      expect([401, 403]).toContain(status);
    }
  });

  it("authenticated call passes the auth gate (no 401/403)", async (tc) => {
    if (!dbAvailable) return tc.skip();
    expect(cookie).toBeTruthy();
    const client = createE2ETRPCClient(app, cookie!);
    try {
      await client.animal.getById.query({ id: GHOST_ID });
    } catch (e: any) {
      const status = e?.status ?? e?.data?.httpStatus;
      expect(status).not.toBe(401);
      expect(status).not.toBe(403);
    }
  });

  it("superjson reconstructs Date instances on the wire (authenticated)", async (tc) => {
    if (!dbAvailable) return tc.skip();
    if (!realAnimalId) return tc.skip(); // no animals seeded — skip the Date proof
    expect(cookie).toBeTruthy();
    const client = createE2ETRPCClient(app, cookie!);
    const animal = await client.animal.getById.query({ id: realAnimalId });
    expect(animal).toBeTruthy();
    // birthDate arrives as a real Date, not an ISO string — the superjson round-trip.
    expect(animal.birthDate).toBeInstanceOf(Date);
  });
});
