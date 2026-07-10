// SPDX-License-Identifier: UNLICENSED
//
// Rocky permission catalog — RE-EXPORT of the isomorphic single source.
//
// The canonical, client-safe `Permissions` / `Permission` definition lives in
// `@rocky/validators/rbac` (isomorphic: no server-only deps, so the
// mobile PDA app and web admin can import it). This module re-exports it
// verbatim so the server-side `@Policy({ action })` system, `Principal`, and
// the client `clientCan`/`useCan` gates all reference ONE definition.
//
// ULTIMATE SOURCE OF TRUTH: `PERMISSION_DEFS` in
// `packages/database/src/seed.ts`. WO-101's drift test (run via
// `@rocky/authorization`'s test suite) compares the seed against this
// re-exported catalog and fails on any mismatch.
//
// ADR-0050 (D1): a single `Permissions` const consumed by seed +
// `@Policy` + frontend. The isomorphic boundary (RN cannot bundle
// `@rocky/authorization`'s server deps) is why the const is defined in
// `@rocky/validators/rbac` and re-exported here, not duplicated.

export {
  Permissions,
  ALL_PERMISSIONS,
  isPermission,
  formatPermission,
  type Permission,
} from "@rocky/validators/rbac";
