// ── TRPC Error Maps ──
// Church and State: domain error codes live in @rocky/domains-*;
// HTTP/tRPC translations live here in @rocky/validators/errors.

export { ANIMAL_TRPC_ERROR_MAP } from "./animal.errors.js";
export { EARTAG_TRPC_ERROR_MAP } from "./eartag.errors.js";
export { FARM_TRPC_ERROR_MAP } from "./farm.errors.js";
export { MOVEMENT_TRPC_ERROR_MAP } from "./movement.errors.js";
export { SUBJECT_TRPC_ERROR_MAP } from "./subject.errors.js";
export { NOTIFICATION_TRPC_ERROR_MAP } from "./notification.errors.js";
export { USER_TRPC_ERROR_MAP } from "./user.errors.js";
export { RBAC_TRPC_ERROR_MAP } from "./rbac.errors.js";
export { ORG_TRPC_ERROR_MAP } from "./organization.errors.js";
export { HEALTH_TRPC_ERROR_MAP } from "./health.errors.js";
export { INSPECTION_TRPC_ERROR_MAP } from "./inspection.errors.js";
export { ARCHIVE_TRPC_ERROR_MAP } from "./archive.errors.js";
export { PASSPORT_TRPC_ERROR_MAP } from "./passport.errors.js";
export { CORRECTION_TRPC_ERROR_MAP } from "./correction.errors.js";
export type { TRPCErrorEntry, TRPCErrorMap } from "./types.js";
