import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import supertest from "supertest";
import type { INestApplication } from "@nestjs/common";
import type { AppRouter } from "@rocky/trpc";

/**
 * Bind a fully-typed tRPC client to a running NestJS app WITHOUT opening a
 * network port. Requests are routed through supertest against the app's
 * in-process HTTP server, so we exercise the real tRPC HTTP adapter end-to-end:
 * the superjson wire format, exact HTTP status codes, and cookie auth.
 *
 * The test code reads exactly like frontend React code
 * (`await client.animal.getById.query({ id })`), but it is executing ruthless
 * full-stack HTTP tests against the real NestJS backend.
 *
 * @param app        A Nest application produced by `Test.createTestingModule`.
 * @param userCookie Optional session cookie (e.g. `rocky.session_token=...`)
 *                    to authenticate the requests.
 */
export function createE2ETRPCClient(app: INestApplication, userCookie?: string) {
  const agent = supertest(app.getHttpServer());

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: "/trpc",
        async fetch(input, options) {
          const url = new URL(input as string, "http://localhost");
          const method = (options?.method?.toLowerCase() || "get") as "get" | "post";

          let request = agent[method](`${url.pathname}${url.search}`);

          // Inject a real (or forged) session cookie here — this is what makes
          // the request authenticated against the PolicyEngine / RLS.
          if (userCookie) {
            request = request.set("Cookie", userCookie);
          }

          if (options?.body) {
            request = request.send(options.body as string);
          }

          const res = await request;

          // Reconstruct a Fetch `Response` so trpc's httpLink can read
          // `res.ok` / `res.status` and parse the (superjson) body.
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value !== undefined) {
              headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
          }

          return new Response(JSON.stringify(res.body), {
            status: res.status,
            headers,
          });
        },
      }),
    ],
  });
}
