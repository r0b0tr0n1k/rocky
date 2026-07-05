# ADR 0010: Date Coercion Architecture

**Status:** Accepted  
**Date:** 2026-07-05  
**Author:** RobotFarm  
**Supersedes:** N/A

## Context

Client payloads arrive as ISO strings (e.g., `"2024-01-15T10:30:00Z"`), but database operations require `Date` objects. Without a unified approach, developers must manually add `z.coerce.date()` to every API validator, leading to:

- Inconsistent date handling across domains
- Forgotten coercions causing runtime errors
- Verbose schema definitions
- Maintenance burden when patterns change

## Decision

We adopt a **centralized date coercion pattern** using Drizzle's schema factory:

```typescript
// packages/database/src/zod/factory.ts
const factory = createSchemaFactory({
  coerce: {
    date: true,
  },
});
```

**Rule:** `createSchemaFactory({ coerce: { date: true } })` means every `createSelectSchema` / `createInsertSchema` / `createUpdateSchema` output uses `z.coerce.date()` for timestamp/date columns.

### Propagation Chain

```
Database Schema (Drizzle)
    ↓
Dumb Zod (packages/database/src/zod/*.ts)
    ↓
API Validators (packages/validators/src/api/*.api.ts)
    ↓
Domain Services (packages/domains/*/src/services/*.ts)
```

Dates stay as `z.coerce.date()` end-to-end through the validation layer.

### Why This Matters

1. **Automatic Parsing:** `z.coerce.date()` automatically parses ISO strings → Date objects
2. **No Manual Overrides:** API validators inherit coercion from DB schemas
3. **Consistent Handling:** All domains follow the same pattern
4. **Type Safety:** TypeScript enforces Date types at compile time
5. **Runtime Safety:** Zod validates and coerces at runtime

## Consequences

### Positive

- Eliminates manual `z.coerce.date()` in 90% of API validators
- Reduces schema verbosity and maintenance burden
- Ensures consistent date handling across all domain boundaries
- Prevents common "string instead of Date" runtime errors
- Aligns with Diamond Seal validation doctrine

### Negative

- Developers must understand the coercion chain
- Debugging requires tracing through factory → Dumb Zod → API validators
- Some edge cases may need manual overrides (e.g., optional date fields)

### Neutral

- All existing API validators must verify they inherit coercion correctly
- New validators automatically benefit without additional configuration
- Documentation must clarify the pattern for onboarding

## Implementation

### Factory Configuration

```typescript
// packages/database/src/zod/factory.ts
import { createSchemaFactory } from "drizzle-orm/zod";

const factory = createSchemaFactory({
  coerce: {
    date: true,
  },
});

export const createSelectSchema = factory.createSelectSchema;
export const createInsertSchema = factory.createInsertSchema;
export const createUpdateSchema = factory.createUpdateSchema;
```

### API Validator Pattern

```typescript
// packages/validators/src/api/example.api.ts
import { createSelectSchema } from "@rocky/database/zod";
import { z } from "zod";

// Dumb Zod inherits z.coerce.date() from factory
const dumbZod = createSelectSchema(exampleTable);

// API validator extends Dumb Zod — dates stay coerced
export const exampleResponseSchema = z.strictObject(
  dumbZod.shape,
);
```

### Interface Alignment

```typescript
// Explicit interface matches schema output
export interface ExampleResponse {
  id: string;
  createdAt: Date;  // Matches z.coerce.date() output
  updatedAt: Date | null;
}

// NoDriftSimple ensures schema ↔ interface alignment
type _drift_exampleResponse = NoDriftSimple<
  z.infer<typeof exampleResponseSchema>,
  ExampleResponse
>;
```

## Alternatives Considered

### 1. Manual Coercion per Validator

```typescript
// Rejected: Verbose, error-prone
export const responseSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});
```

**Why rejected:** Inconsistent, maintenance burden, forgotten coercions.

### 2. Global Zod Plugin

```typescript
// Rejected: Opaque, hard to debug
z.plugin(zodCoerceDates());
```

**Why rejected:** Magic behavior, difficult to trace, debugging nightmare.

### 3. Transform at Service Layer

```typescript
// Rejected: Late transformation, type mismatch
const service = {
  transform: (data) => ({
    ...data,
    createdAt: new Date(data.createdAt),
  }),
};
```

**Why rejected:** Runtime errors, no compile-time safety, duplicated logic.

## References

- [Drizzle Zod Documentation](https://orm.drizzle.team/docs/zod)
- [Zod Coerce Documentation](https://zod.dev/?id=coercion-for-primitives)
- [Diamond Seal Validation Doctrine](../../packages/validators/src/utils/type-bridge.ts)

## Related ADRs

- ADR 0008: Diamond Seal Testing Doctrine (validation patterns)
