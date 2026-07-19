# RobotFarm: remediate 10 Diamond Seal §8.2 service/DB arrears (4 RED + 6 AMBER)

## Rule

ROCKY-DS 001:2026(E) §8.2 — the service layer (L4) shall access the database ONLY through its own-domain
repository; it shall NOT import `@rocky/database` (the Drizzle client or table definitions) directly.
Annex C visa matrix permits `@rocky/database/constants` (Dictionary), `@rocky/validators/api`,
`@rocky/domains-shared`, and own-domain `repositories/` (relative). §8.5 allows cross-domain DI wiring in
`*.module.ts` only — not in `*.service.ts`.

## 4 RED — remediated NOW (this plan)

| Service | Forbidden import | Fix |
|---------|------------------|-----|
| `packages/domains/notification/src/services/notification.service.ts` | `notifications` (type), `deviceTokens` (value) | Delete; import `NotificationRow`/`DeviceTokenRow` from `NotificationRepository`. `NOTIFICATION_TYPE` (constants) stays. |
| `packages/domains/notification/src/services/subscription-resolver.service.ts` | `db`, `eventSubscriptions`/`reminders`/`notificationDeliveries`, `users`, `eq,and` | New `NotificationRepository` methods + `UserRepository.findByRole`; inject `UserRepository`; remove `db`/`drizzle-orm`. |
| `packages/domains/inspection/src/services/risk-analysis.service.ts` | `DatabaseProvider`, 5 tables, `eq,and,sql,desc` | New `RiskAnalysisRepository` (sibling) + `FarmRepository` aggregate; inject repos; wrap cron in `ExecutionPipeline.run(SYSTEM_PRINCIPAL, ...)`. |
| `packages/domains/iot/src/services/iot.service.ts` | `iotDevices` (dead) | Delete line 2. |

## 6 AMBER — deferred follow-up (NOT in this plan)

Type-only table access: `animal`, `farm`, `movement`, `user`, `organization`, `device` services use
`typeof import("@rocky/database").X.$inferInsert` casts. Fix pattern (same as Service A): have each
repository re-export row-shape types (`export type XRow = typeof table.$inferInsert`); services import
them relative from the repo. No behavioral change. Track as sub-tasks of this issue / a follow-up plan.

## Tracking

- Plan: `.pi/plans/2026-07-17-service-db-arrears/plan.md`
- Verification: `pnpm build` (real gate) + `pnpm ci:checks` + `lens_diagnostics` (ci:checks != build).
