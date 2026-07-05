// ── Well-Known Principal Instances ──
// Not every request has a user (login, register, health checks).
// Not every trigger has a user (cron, system events).

import { Principal } from "./principal.js";

/**
 * Unauthenticated principal — used for public endpoints.
 * Has no roles, no permissions, no organization.
 */
export const ANONYMOUS_PRINCIPAL: Principal = Principal.create({
  id: "anonymous",
  username: "anonymous",
  roles: [],
  permissions: [],
  organization: null,
  accessLevel: "own",
  claims: { locale: "MK" },
});

/**
 * System principal — used for cron jobs, system events, CLI commands.
 * Has all permissions (wildcard `*`).
 */
export const SYSTEM_PRINCIPAL: Principal = Principal.create({
  id: "system",
  username: "system",
  roles: ["SYSTEM"],
  permissions: ["*"],
  organization: null,
  accessLevel: "all",
  claims: { locale: "MK" },
});
