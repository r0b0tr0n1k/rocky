/**
 * ⛔ DOMAIN TABLE MAP — DO NOT EDIT MANUALLY UNLESS ADDING A NEW DOMAIN.
 *
 * Maps each domain to its schema files. The generator reads this to emit
 * per-domain Dumb Zod files. Every pgTable export across all schema files
 * must be claimed by exactly one domain.
 *
 * To add a new domain:
 *   1. Create the schema file in packages/database/src/schema/<domain>/
 *   2. Add an entry here mapping the domain name to its schema file(s)
 *   3. Run: node scripts/generate-dumb-zod.mjs
 *
 * Format: domainName → [relative paths from packages/database/src/schema/]
 */

export const DOMAIN_TABLE_MAP = {
    animal: [
        "an/animals.ts",
        "an/ear-tags.ts",
        "an/birth-notifications.ts",
    ],
    eartag: [
        "an/ear-tag-allocations.ts",
        "an/ear-tag-orders.ts",
        "an/ear-tag-replacements.ts",
        "an/ear-tag-takeovers.ts",
        "an/ear-tag-types.ts",
    ],
    movement: [
        "an/movements.ts",
        "an/pasture.ts",
        "an/import-export-records.ts",
    ],
    passport: [
        "an/cattle-passports.ts",
        "an/form-reprints.ts",
    ],
    inspection: [
        "an/inspections.ts",
        "an/risk-analyses.ts",
        "an/sanitary-inspections.ts",
    ],
    archive: [
        "an/archive-documents.ts",
    ],
    correction: [
        "an/error-corrections.ts",
    ],
    iot: [
        "an/iot-devices.ts",
        "an/sensor-readings.ts",
        "an/geofences.ts",
        "an/animal-geofence-events.ts",
        "an/pda-devices.ts",
        "an/settlements.ts",
    ],
    farm: [
        "hk/addresses.ts",
        "hk/farms.ts",
        "hk/farm-subjects.ts",
        "hk/subjects.ts",
        "hk/farm-books.ts",
        "hk/vs-contracts.ts",
        "hk/vs-assignments.ts",
        "hk/sync-errors.ts",
    ],
    health: [
        "hd/diseases.ts",
        "hd/vaccines.ts",
        "hd/vaccine-batches.ts",
        "hd/vaccinations.ts",
        "hd/treatments.ts",
        "hd/lab-tests.ts",
        "hd/vaccine-diseases.ts",
    ],
    auth: [
        "auth/user.ts",
        "auth/session.ts",
        "auth/account.ts",
        "auth/verification.ts",
    ],
    user: [
        "sm/users.ts",
        "sm/device-tokens.ts",
    ],
    organization: [
        "sm/organizations.ts",
    ],
    rbac: [
        "sm/rbac.ts",
    ],
    notification: [
        "sm/notifications.ts",
        "sm/notification-preferences.ts",
        "sm/notification-templates.ts",
        "events/notification-deliveries.ts",
        "events/event-subscriptions.ts",
        "events/reminders.ts",
    ],
    audit: [
        "sm/audit-log.ts",
    ],
    modules: [
        "sm/modules.ts",
    ],
    outbox: [
        "sm/outbox-events.ts",
    ],
    sync: [
        "sync.ts",
    ],
    demo: [
        "demo/todos.ts",
    ],
} as const;

export type DomainName = keyof typeof DOMAIN_TABLE_MAP;
