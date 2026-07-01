import type { AppRouter } from "@yourcompany/api/types";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
