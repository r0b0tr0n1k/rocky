# Drizzle Relational Queries v2 Migration — Remaining Work

## Current State

- `drizzle-orm@1.0.0-rc.4` and `drizzle-kit@1.0.0-rc.4` already installed.
- Central `relations.ts` already uses v2 `defineRelations(schema, (r) => ({...}))`.
- 18 schema files contain dead `defineRelations` imports; 10 export dead relation objects using a broken mix of v2 `defineRelations` + v1 config (`fields`/`references`).
- `index.ts` still passes `schema` to `drizzle()` alongside `relations`.
- 3 `db.query` usages still use v1 function-syntax `where` clauses.

## Changes Required

### 1. `packages/database/src/index.ts`
Remove the `schema` option from `drizzle()`. Keep `relations` only.

```diff
- 	schema: {
- 		...sm,
- 		...hk,
- 		...an,
- 		...auth,
- 		...demo,
- 	},
 	relations,
```

### 2. `packages/domains-notification/src/services/notification.service.ts`
Migrate 2 relational queries from function `where` to object syntax.

**Line ~105–110**
```ts
const prefs = await this.db.query.notificationPreferences.findFirst({
- 	where: (prefs, { eq, and }) =>
- 		and(
- 			eq(prefs.userId, validated.userId),
- 			eq(prefs.category, validated.category),
- 		),
+ 	where: {
+ 		userId: validated.userId,
+ 		category: validated.category,
+ 	},
});
```

**Line ~305**
```ts
const template = await this.db.query.notificationTemplates.findFirst({
- 	where: eq(notificationTemplates.code, code),
+ 	where: {
+ 		code: { eq: code },
+ 	},
});
```

### 3. `apps/api/src/notification/notification-triggers.service.ts`
Migrate 1 relational query from function `where` to object syntax.

**Line ~74–76**
```ts
const user = await db.query.users.findFirst({
- 	where: eq(users.id, userId),
+ 	where: { id: { eq: userId } },
});
```

### 4. Dead code cleanup in `packages/database/src/schema/`
Remove unused `defineRelations` imports and exported relation objects from the following files — the central `relations.ts` already owns all relations:
- `sm/users.ts`
- `sm/organizations.ts`
- `sm/rbac.ts`
- `sm/notifications.ts`
- `sm/notification-preferences.ts`
- `hk/farms.ts`
- `hk/farm-subjects.ts`
- `hk/addresses.ts`
- `an/animals.ts`
- `an/movements.ts`
- `an/birth-notifications.ts`
- `an/ear-tag-orders.ts`
- `an/ear-tags.ts`
- `an/ear-tag-replacements.ts`
- `an/ear-tag-allocations.ts`
- `an/ear-tag-types.ts`

Also remove the re-exports from `an/ear-tags-index.ts`.

## Validation

- `pnpm -C packages/database lint` (if lint script exists)
- `pnpm -C packages/database typecheck`
- `pnpm -C apps/api build` and `pnpm build` for affected packages
