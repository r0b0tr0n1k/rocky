import { trpc } from "#/providers/trpc-provider.js";

export function useApi() {
  return trpc;
}
