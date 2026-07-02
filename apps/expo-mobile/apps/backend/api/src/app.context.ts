import { Injectable } from "@nestjs/common";
import type { User, Session } from "better-auth";

@Injectable()
export class AppContext {
  headers: Headers = new Headers();
  user:
    | (User & {
        role: string;
        permissions: string[];
      })
    | null = null;
  session: Session | null = null;
}
