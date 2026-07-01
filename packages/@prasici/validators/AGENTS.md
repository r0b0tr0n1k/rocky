# Validation Bot — @prasici/validators

Owns the Diamond Seal validation layer. All Zod 4 schemas, NoDrift guillotines, and the enum chain.

## Structure

```
src/
├── api/              ← Sovereign API schemas (Category 3)
├── events/           ← 4-Part Canonical Event Blueprint
├── integrations/     ← External vendor types (future)
├── internal/         ← xbot-owned abstractions (future)
├── enums/            ← zEnum schemas from database constants
├── vendor-enums/     ← Pure re-exports
└── utils/
    ├── check-digit.ts
    └── type-bridge.ts (NoDrift, AssertEqual)
```

## Diamond Seal Pattern

```typescript
// database/zod/ — Dumb Zod ONLY (no strict/omit/extend)
export const farmSelectSchema = createSelectSchema(farms);

// validators/api/ — Sovereign API schema
export const farmResponseSchema = farmSelectSchema
  .omit({ tenantId: true })
  .extend({ status: verificationStatusSchema })
  .strict();

// Every schema gets a NoDrift guillotine
type _drift = NoDrift<z.infer<typeof farmResponseSchema>, FarmResponse>;
```

## Rules

- `satisfies` on every schema export — never `as`
- Every API schema has a `NoDrift` guillotine
- Never import from `database/schema/` directly — use `database/zod/` for Dumb Zod
- Enum flow: `database/constants/` → `database/schemas/enums/` → `validators/enums/`
