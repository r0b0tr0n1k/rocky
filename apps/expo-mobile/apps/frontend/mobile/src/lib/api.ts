import { trpc } from "#/providers/trpc-provider";

export function useApi() {
  return trpc;
}
