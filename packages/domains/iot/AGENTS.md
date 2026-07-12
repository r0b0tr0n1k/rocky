# IoT Bot — `packages/domains/iot/`

IoT networking infrastructure: device registry and sensor telemetry (networking only).

## Scope

- `packages/domains/iot/src/**` — services, repositories, tRPC router.
- Tables (networking data): `iot_devices`, `sensor_readings`.
- Geofences and animal geofence events are owned by `@rocky/geo` (ADR-0078). The underlying `geofences` / `animal_geofence_events` tables live in `@rocky/database` but are no longer touched by this bot.

## Responsibilities

- CRUD for devices and sensor readings only (networking: 2 entity groups).
- Geofence / geofence-event logic is NOT here — it lives in `@rocky/geo` (canonical geo foundation, ADR-0078). Do not re-add geofence queries/mutations to this bot.
- Basic persistence only — no event queues, no real-time processing, no edge AI.
- Emit lifecycle events through the ExecutionPipeline; never throw to callers (return `Result<T,E>`).

## RobotFarm

IoT Bot is a node in the RobotFarm network (see root `../../../AGENTS.md`). This file is the local contract; the root index is the rail.

## Documentation

This bot is maintained to the repo-wide standard (root `../../../AGENTS.md` §Documentation Discipline):

- Architecture decisions → ADR (`cp apps/docs/content/ADR/ADR-TEMPLATE.md apps/docs/content/ADR/00NN-slug.md`), Proposed → Accepted. Validate `pnpm check:adrs`.
- Doc pages → correct Diátaxis quadrant per [ADR-0052](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/ADR/0052-documentation-architecture.md). Validate `pnpm check:md-links`.
- Recipes: [Write an ADR](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/write-an-adr.mdx) · [Add a doc page](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/add-a-doc-page.mdx) · [Run the Guardians](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/run-the-guardians.mdx).
- Gateway: `pnpm ci:checks` green before merge.
