import type { Session, User } from "better-auth";

export interface AppContext {
  headers: Headers;
  user: (User & {
    role: string;
    permissions: string[];
  }) | null;
  session: Session | null;
  [key: string]: unknown;
}
