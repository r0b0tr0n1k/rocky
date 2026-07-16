import { observable } from "@trpc/server/observable";
import { TRPCClientError } from "@trpc/client";
import type { TRPCLink } from "@trpc/client";
import type { AppRouter } from "@rocky/trpc";

export type FakeHandler = (input: unknown) => unknown | Promise<unknown>;

/**
 * Offline, deterministic tRPC link. Every query/mutation resolves from the
 * handler map — no network, no timers. Return a value to resolve; throw to
 * simulate an error (assert error UI deterministically). Path = "domain.proc"
 * (e.g. "health.recordVaccination").
 */
export function createFakeLink(handlers: Record<string, FakeHandler> = {}): TRPCLink<AppRouter> {
  return () => (ctx) =>
    observable((observer) => {
      const handler = handlers[ctx.op.path];
      if (!handler) {
        observer.error(
          TRPCClientError.from(new Error(`[fakeLink] no handler for ${ctx.op.path}`)) as TRPCClientError<AppRouter>,
        );
        return;
      }
      Promise.resolve()
        .then(() => handler(ctx.op.input))
        .then(
          (data) => {
            observer.next({ result: { type: "data", data } });
            observer.complete();
          },
          (err) => observer.error(err),
        );
    });
}
