# Repository Patterns & Anti-Patterns

## Overview

Repositories are the **sole gatekeepers to the database** (Diamond Seal Layer 2). They are shovels, not announcers. This document defines the canonical patterns and anti-patterns for all `*.repository.ts` files in the Rocky monorepo.

**Related panopticon rules:** `LAW1`, `LAW3I`, `LAW3J`, `LAW9B`, `LAW4`

---

## ✅ Patterns (What TO Do)

### P1: Import Only From Allowed Packages

```typescript
// ✅ CORRECT — repositories import only from these packages
import type { Database, Farm } from "@rocky/database"; // DB types
import { farms, FARM_TYPE, VERIFICATION_STATUS } from "@rocky/database"; // Schema tables & constants
import { farmSelectSchema } from "@rocky/database/zod"; // Dumb Zod schemas
import { and, eq, sql } from "drizzle-orm"; // Query builders
import { BaseRepository, ValidatedRepository } from "@rocky/repository-shared"; // Base classes
import { err, ok, type Result } from "@rocky/errors"; // Result pattern
```

**Allowed imports:**

- `@rocky/database` — schema tables, column types, `Database` type, branded enums
- `@rocky/database/zod` — dumb Zod schemas (`*SelectSchema`, `*InsertSchema`)
- `@rocky/database/constants/*` — branded enum values (`FARM_TYPE`, `VERIFICATION_STATUS`, etc.)
- `@rocky/repository-shared` — `ValidatedRepository`, `BaseRepository`
- `@rocky/errors` — `Result`, `DbError`, error helpers
- `drizzle-orm` — query builders (`and`, `eq`, `sql`, `count`, etc.)
- `zod` — for local schema validation
- `@nestjs/common` — `Inject`, `Injectable`

### P2: Define Repository-Local Types

```typescript
// ✅ CORRECT — define types locally, don't import from validators
interface CreateFarmInput {
  name: string;
  registrationNumber: string;
  farmTypeId: string;
  addressId?: string;
  status?: string;
}

interface UpdateFarmInput {
  name?: string;
  registrationNumber?: string;
  farmTypeId?: string;
  addressId?: string;
  status?: string;
  verificationStatus?: string;
}

interface FarmOutput {
  id: string;
  name: string;
  registrationNumber: string;
  farmTypeId: string;
  status: string;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Why:** Repositories define their own DB-level types. API types belong in the service layer.

### P3: Use Branded Enum Values From Constants

```typescript
// ✅ CORRECT — import branded enum objects
import { FARM_TYPE, VERIFICATION_STATUS } from "@rocky/database";

// Use in queries
eq(farms.farmType, FARM_TYPE.FARM);
eq(farms.verificationStatus, VERIFICATION_STATUS.APPROVED);

// Use in comparisons
if (farm.status === FARM_TYPE.SLAUGHTERHOUSE) {
  // ...
}
```

**Why:** Branded enums provide type safety and SSOT (Single Source of Truth).

### P4: Extend BaseRepository or ValidatedRepository

```typescript
// ✅ CORRECT — standard repository with CRUD
@Injectable()
export class FarmsRepository extends BaseRepository<
  Farm,
  typeof farms,
  typeof farmSelectSchema
> {
  constructor(
    @Inject(DATABASE_CONNECTION) db: Database,
  ) {
    super(db, farms, farmSelectSchema);
  }

  // Custom methods...
}
```

**Or use ValidatedRepository for custom behavior:**

```typescript
// ✅ CORRECT — repository with custom validation
@Injectable()
export class AnimalsRepository extends ValidatedRepository<
  Animal,
  typeof animals,
  typeof animalSelectSchema
> {
  constructor(
    @Inject(DATABASE_CONNECTION) db: Database,
  ) {
    super({ db, table: animals, selectSchema: animalSelectSchema });
  }

  // Custom methods with full control
}
```

### P5: Use withTransaction() for All Queries

```typescript
// ✅ CORRECT — always use withTransaction() for queries
async getById(id: string): Promise<Farm | null> {
  return this.withTransaction(async (tx) => {
    const [result] = await tx
      .select()
      .from(farms)
      .where(eq(farms.id, id));
    return result ?? null;
  });
}
```

### P6: Return Result<T, E> for Mutations

```typescript
// ✅ CORRECT — use Result pattern for create/update/delete
async create(data: CreateFarmInput): Promise<Result<Farm, DbError>> {
  return this.withErrorHandling(async () => {
    const validated = this.validate(data, { stripUnknown: true });

    return this.withTransaction(async (tx) => {
      const [result] = await tx
        .insert(farms)
        .values(validated)
        .returning();

      if (!result) {
        throw new DbError("insert", { code: "INSERT_FAILED" });
      }

      return result;
    });
  });
}
```

### P7: Use validatePartial for Updates

```typescript
// ✅ CORRECT — use validatePartial for partial updates
async update(id: string, data: UpdateFarmInput): Promise<Result<Farm, DbError>> {
  return this.withErrorHandling(async () => {
    const validated = this.validatePartial({
      ...data,
      updatedAt: new Date(),
    }, { stripUnknown: true });

    return this.withTransaction(async (tx) => {
      const [result] = await tx
        .update(farms)
        .set(validated)
        .where(eq(farms.id, id))
        .returning();

      if (!result) {
        throw new DbError("update", { code: "UPDATE_FAILED", id });
      }

      return result;
    });
  });
}
```

### P8: Export DB Types Under Repository-Friendly Names

```typescript
// ✅ CORRECT — re-export DB types with shorter names
import type {
  Farm,
  EarTag as EarTagDb,
} from "@rocky/database";

// Use locally
type FarmEntity = Farm;
type EarTag = EarTagDb;
```

### P9: Use SQL Template Literals for Complex Queries

```typescript
// ✅ CORRECT — use sql`` for raw SQL expressions
import { sql } from "drizzle-orm";

async getMovementsByDateRange(from: Date, to: Date) {
  return this.withTransaction(async (tx) => {
    const result = await tx
      .select({
        day: sql<Date>`date_trunc('day', ${movements.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(movements)
      .where(
        and(
          gte(movements.createdAt, from),
          lte(movements.createdAt, to),
        )
      )
      .groupBy(sql`date_trunc('day', ${movements.createdAt})`);

    return result;
  });
}
```

### P10: Keep Repositories Focused (≤400 lines)

```typescript
// ✅ CORRECT — if a repository grows too large, split into sub-repositories
// farms.repository.ts — core farm CRUD
// farms-stats.repository.ts — farm statistics and analytics
// farms-search.repository.ts — farm search and filtering
```

---

## ❌ Anti-Patterns (What NOT To Do)

### AP1: Never Import From @rocky/validators

```typescript
// ❌ WRONG — repositories must NOT import from validators
import { AdminCreateFarmInput } from "@rocky/validators/api";
import { FarmOutput } from "@rocky/validators/api";
import { FarmStatusEnum } from "@rocky/validators/enums";

// ✅ CORRECT — define types locally
interface CreateFarmInput {
  name: string;
  registrationNumber: string;
  status?: string;
}
```

**Panopticon rule:** `LAW1` — Repository Bedrock

### AP2: Never Import From @rocky/database/schema Directly

```typescript
// ❌ WRONG — don't import schema objects directly
import { farms } from "@rocky/database/schema/hk/schema";

// ✅ CORRECT — import from @rocky/database barrel
import { farms } from "@rocky/database";
```

**Panopticon rule:** `LAW1` — layer ban pattern `@rocky/database/(schemas|zod)/?`

### AP3: Never Import From @rocky/database/zod Directly

```typescript
// ❌ WRONG — don't import zod schemas from zod path
import { farmSelectSchema } from "@rocky/database/zod/farms";

// ✅ CORRECT — import from @rocky/database/zod barrel
import { farmSelectSchema } from "@rocky/database/zod";
```

**Panopticon rule:** `LAW1` — layer ban pattern `@rocky/database/(schemas|zod)/?`

### AP4: Never Publish Events

```typescript
// ❌ WRONG — repositories must NOT publish events
import { EventPublisher } from '@some-event-library';

@Injectable()
export class FarmsRepository {
  constructor(
    private readonly _eventPublisher: EventPublisher,  // ❌ NO!
  ) {}

  async create(data: CreateFarmInput) {
    const farm = await this.save(data);
    this._eventPublisher.publish('farm.created', { farmId: farm.id });  // ❌ NO!
    return farm;
  }
}

// ✅ CORRECT — return the result, let the service layer publish events
async create(data: CreateFarmInput): Promise<Result<Farm, DbError>> {
  return this.withErrorHandling(async () => {
    const validated = this.validate(data, { stripUnknown: true });

    return this.withTransaction(async (tx) => {
      const [result] = await tx
        .insert(farms)
        .values(validated)
        .returning();

      return result ? ok(result) : err(new DbError("insert", { code: "INSERT_FAILED" }));
    });
  });
}
```

**Panopticon rule:** `LAW4` — Queue Discipline

### AP5: Never Use Hardcoded Enum Strings

```typescript
// ❌ WRONG — hardcoded enum strings
if (farm.status === 'ACTIVE') { ... }
eq(farms.farmType, 'SLAUGHTERHOUSE')

// ✅ CORRECT — use branded enum constants
import { FARM_TYPE, FARM_STATUS } from '@rocky/database';
if (farm.status === FARM_STATUS.ACTIVE) { ... }
eq(farms.farmType, FARM_TYPE.SLAUGHTERHOUSE)
```

**Panopticon rule:** `LAW3I` — Hardcoded Enum String Detection

### AP6: Never Use `as any` or `as string` Type Casts

```typescript
// ❌ WRONG — loose type casts
const status = someValue as string;
const data = rawData as any;

// ✅ CORRECT — use proper types or Zod validation
const status: FarmStatus = FARM_STATUS.ACTIVE;
const data = animalSchema.parse(rawData);
```

### AP7: Never Access process.env Directly

```typescript
// ❌ WRONG — direct env access in repository
const dbUrl = process.env.DATABASE_URL;

// ✅ CORRECT — inject config via constructor or use DATABASE_CONNECTION
constructor(@Inject(DATABASE_CONNECTION) db: Database) {}
```

### AP8: Never Use console.log

```typescript
// ❌ WRONG — console.log in repository
console.log("Creating farm:", data);

// ✅ CORRECT — use logger from @rocky/logger (in service layer)
// Or use observability spans
import { withSpan } from "@rocky/observability";
```

### AP9: Never Return API Types

```typescript
// ❌ WRONG — returning API output types
import { AdminFarmOutput } from '@rocky/validators/api';

async getFarm(id: string): Promise<AdminFarmOutput> { ... }

// ✅ CORRECT — return DB entity types, let service layer transform
async getFarm(id: string): Promise<Farm | null> { ... }
```

### AP10: Never Use `new Map()` for State

```typescript
// ❌ WRONG — in-memory state in repository
const cache = new Map<string, Farm>();

// ✅ CORRECT — repositories are stateless; use Redis for caching
```

### AP11: Never Bypass Validation

```typescript
// ❌ WRONG — skip validation for performance
async create(data: CreateFarmInput) {
  return this.withTransaction(async (tx) => {
    return await tx.insert(farms).values(data).returning();
  });
}

// ✅ CORRECT — always validate
async create(data: CreateFarmInput): Promise<Result<Farm, DbError>> {
  return this.withErrorHandling(async () => {
    const validated = this.validate(data, { stripUnknown: true });

    return this.withTransaction(async (tx) => {
      const [result] = await tx
        .insert(farms)
        .values(validated)
        .returning();

      return result ? ok(result) : err(new DbError("insert", { code: "INSERT_FAILED" }));
    });
  });
}
```

---

## File Structure Template

```typescript
/**
 * Farm Repository
 *
 * @description Manages farm entity CRUD operations
 * @scope Global (no tenant scoping)
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Database, Farm } from '@rocky/database';
import { farms, FARM_TYPE, VERIFICATION_STATUS } from '@rocky/database';
import { farmSelectSchema } from '@rocky/database/zod';
import { BaseRepository } from '@rocky/repository-shared';
import { eq, and, desc, sql } from 'drizzle-orm';

// ── Repository-local types ──────────────────────────────────────────────
interface CreateFarmInput {
  name: string;
  registrationNumber: string;
  farmTypeId: string;
  addressId?: string;
}

interface UpdateFarmInput {
  name?: string;
  registrationNumber?: string;
  farmTypeId?: string;
  addressId?: string;
  status?: string;
  verificationStatus?: string;
}

// ── Repository ──────────────────────────────────────────────────────────
@Injectable()
export class FarmsRepository extends BaseRepository<
  Farm,
  typeof farms,
  typeof farmSelectSchema
> {
  constructor(
    @Inject(DATABASE_CONNECTION) db: Database,
  ) {
    super(db, farms, farmSelectSchema);
  }

  // ── Custom Queries ─────────────────────────────────────────────────────

  /**
   * Get farms by registration number
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<Farm[]> {
    return this.withTransaction(async (tx) => {
      return await tx
        .select()
        .from(farms)
        .where(eq(farms.registrationNumber, registrationNumber));
    });
  }

  /**
   * Get farms by type
   */
  async getByFarmType(farmType: string): Promise<Farm[]> {
    return this.withTransaction(async (tx) => {
      return await tx
        .select()
        .from(farms)
        .where(eq(farms.farmType, farmType));
    });
  }

  /**
   * Get pending verification farms
   */
  async getPendingVerification(): Promise<Farm[]> {
    return this.withTransaction(async (tx) => {
      return await tx
        .select()
        .from(farms)
        .where(eq(farms.verificationStatus, VERIFICATION_STATUS.PENDING_VD_APPROVAL))
        .orderBy(desc(farms.createdAt));
    });
  }

  /**
   * Search farms by name or registration number
   */
  async search(query: string): Promise<Farm[]> {
    return this.withTransaction(async (tx) => {
      const searchPattern = `%${query}%`;
      return await tx
        .select()
        .from(farms)
        .where(
          sql`${farms.name} ILIKE ${searchPattern} OR ${farms.registrationNumber} ILIKE ${searchPattern}`
        );
    });
  }
}
```

---

## Biome Configuration

Add these rules to `biome.json` to enforce repository patterns:

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      },
      "style": {
        "noParameterAssign": "warn"
      }
    }
  },
  "overrides": [
    {
      "includes": ["**/*.repository.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "error"
          }
        }
      }
    }
  ]
}
```

**Note:** Custom Biome lint plugins for repository-specific patterns are not currently available. Manual code review and pattern enforcement is required.

---

## Quick Reference Card

| Do                                     | Don't                                               |
| -------------------------------------- | --------------------------------------------------- |
| Import from `@rocky/database`         | Import from `@rocky/validators`                    |
| Import from `@rocky/database/constants` | Import from `@rocky/database/schema` directly     |
| Define local types                     | Import API types                                    |
| Use branded enums (`FARM_TYPE.FARM`)  | Use hardcoded strings (`'FARM'`)                    |
| Extend `BaseRepository` or `ValidatedRepository` | Extend other classes                              |
| Use `withTransaction()` for queries   | Query without transaction wrapper                   |
| Return `Result<T, E>`                  | Return raw entities from mutations                  |
| Keep ≤400 lines                        | Grow to 1000+ lines                                 |
| Use `validatePartial` for updates     | Use `validate` for partial updates                  |
| Export DB types locally                | Import types from other domains                     |

---

## File Size Limits

Repositories must not exceed 400 lines. If a repository grows too large, split it:

```
farms.repository.ts        — Core farm CRUD (≤200 lines)
farms-stats.repository.ts  — Statistics and analytics (≤150 lines)
farms-search.repository.ts — Search and filtering (≤150 lines)
```

---

## Migration Guide: From Manual to Repository Pattern

### Before (Manual Queries)

```typescript
// ❌ OLD WAY — manual queries in service
@Injectable()
export class FarmsService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    this._db = db;
  }

  async createFarm(data: CreateFarmDto) {
    const [farm] = await this._db
      .insert(farms)
      .values(data)
      .returning();

    // Event publishing mixed with DB logic
    this._eventPublisher.publish('farm.created', { farmId: farm.id });

    return farm;
  }
}
```

### After (Repository Pattern)

```typescript
// ✅ NEW WAY — clean separation

// 1. Repository (DB layer only)
@Injectable()
export class FarmsRepository extends BaseRepository<Farm, typeof farms, typeof farmSelectSchema> {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, farms, farmSelectSchema);
  }
}

// 2. Service (business logic + events)
@Injectable()
export class FarmsService {
  constructor(
    private readonly _farmsRepo: FarmsRepository,
    private readonly _eventPublisher: EventPublisher,
  ) {}

  async createFarm(data: CreateFarmDto): Promise<Result<Farm, Error>> {
    const result = await this._farmsRepo.create(data);

    if (result.isOk()) {
      // Service layer handles events
      this._eventPublisher.publish('farm.created', { farmId: result.value.id });
    }

    return result;
  }
}
```

---

## Testing Guidelines

### Unit Tests (Mock Database)

```typescript
describe('FarmsRepository', () => {
  let repository: FarmsRepository;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = createMockDb();
    repository = new FarmsRepository(mockDb);
  });

  it('should create farm', async () => {
    const input: CreateFarmInput = {
      name: 'Test Farm',
      registrationNumber: 'MK-12345',
      farmTypeId: 'farm-type-id',
    };

    mockDb.insert.mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: '123', ...input }]),
    } as any);

    const result = await repository.create(input);

    expect(result.isOk()).toBe(true);
    expect(result.value.name).toBe('Test Farm');
  });
});
```

### Integration Tests (Real Database)

```typescript
describe('FarmsRepository (Integration)', () => {
  let repository: FarmsRepository;
  let db: Database;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new FarmsRepository(db);
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should create and retrieve farm', async () => {
    const input: CreateFarmInput = {
      name: 'Test Farm',
      registrationNumber: 'MK-12345',
      farmTypeId: 'farm-type-id',
    };

    const createResult = await repository.create(input);
    expect(createResult.isOk()).toBe(true);

    const farm = await repository.getById(createResult.value.id);
    expect(farm).toBeDefined();
    expect(farm?.name).toBe('Test Farm');
  });
});
```

---

## Rocky-Specific Notes

### Multi-Schema Support

Rocky uses multiple PostgreSQL schemas:
- `sm` — System management (users, organizations, lookups)
- `hk` — Holding kinetics (farms, movements, locations)
- `an` — Animals (ear tags, individual animals, events)
- `auth` — better-auth tables
- `demo` — Demo data

Each schema should have its own repository package structure:

```
apps/api/src/repositories/
├── sm/
│   ├── users.repository.ts
│   └── organizations.repository.ts
├── hk/
│   ├── farms.repository.ts
│   └── movements.repository.ts
├── an/
│   ├── ear-tags.repository.ts
│   └── animals.repository.ts
└── auth/
    └── auth.repository.ts
```

### RLS (Row Level Security)

Rocky enforces multi-tenant access at the database level through RLS policies. Repositories don't need to implement RLS manually—the database handles it via policies like:

```sql
-- Example RLS policy
CREATE POLICY auth_rls_farms_district ON farms
  FOR ALL
  TO authenticated_user
  USING (district_id = current_user_district_id());
```

---

## Next Steps

1. **Implement Example Repository** — See `apps/api/src/repositories/hk/farms.repository.ts`
2. **Run Tests** — Ensure repository tests pass
3. **Update Services** — Refactor services to use new repositories
4. **Add Linting Rules** — Enable Biome plugin for anti-pattern detection
