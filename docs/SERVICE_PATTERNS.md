# Service Patterns & Anti-Patterns

## Overview

Domain services are the **business logic orchestration layer** between API routers and repositories. They orchestrate the full flow: validate API input → inject context → delegate to repositories → publish events (optional). This document defines the canonical patterns and anti-patterns for all `*.service.ts` files in the Rocky monorepo.

**Diamond Seal position:** Layer 4 (Domain Logic) — between API routers (L5) and repositories (L2).

**Key responsibility:** Services own the business logic and event publishing, while repositories own data access.

---

## ✅ Patterns (What TO Do)

### P1: Import Only From Allowed Packages

```typescript
// ✅ CORRECT — services import only from these packages
import { createFarmInputSchema } from "@rocky/validators/api"; // API schemas
import { ok, err, isSuccess, type Result } from "@rocky/errors"; // Result pattern
import { Logger } from "@nestjs/common"; // NestJS logging
import { FarmsRepository } from "./farms.repository"; // Own repository
import { FARM_ERRORS, type FarmErrorCode, farmErr } from "./farms.errors"; // Own error codes
import { FARM_TYPE, VERIFICATION_STATUS } from "@rocky/database"; // Branded enums
```

**Allowed imports:**

- `@nestjs/common` — NestJS decorators (`Injectable`, `Inject`, `Optional`)
- `@rocky/validators/api` — API input/output schemas (when validators package is created)
- `@rocky/errors` — `Result`, `ok`, `err`, `isSuccess` (neverthrow)
- `@nestjs/common` — `Logger` for logging
- `@rocky/database` — branded enum objects (`FARM_TYPE`, `VERIFICATION_STATUS`)
- `./{entity}.repository` — own domain's repository
- `./{domain}.errors` — own domain's error codes

### P2: Define Domain-Specific Error Codes

```typescript
// ✅ CORRECT — error codes in <domain>.errors.ts
export const FARM_NOT_FOUND = "FARM_NOT_FOUND" as const;
export const FARM_ALREADY_EXISTS = "FARM_ALREADY_EXISTS" as const;
export const FARM_VALIDATION_FAILED = "FARM_VALIDATION_FAILED" as const;
export const FARM_DATABASE_ERROR = "FARM_DATABASE_ERROR" as const;

export type FarmErrorCode =
  | typeof FARM_NOT_FOUND
  | typeof FARM_ALREADY_EXISTS
  | typeof FARM_VALIDATION_FAILED
  | typeof FARM_DATABASE_ERROR;

// Error creator helper
export function farmErr(code: FarmErrorCode, message: string): Err<FarmErrorCode> {
  return err({ code, message });
}
```

**Location:** `/apps/api/src/repositories/{schema}/{domain}.errors.ts`

### P3: Orchestrate the Full Flow (Validate → Inject → Delegate → Return)

```typescript
// ✅ CORRECT — service orchestrates the complete flow
async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
  // 1. VALIDATE INPUT (when validators package exists)
  // const parsed = createFarmInputSchema.safeParse(input);
  // if (!parsed.success) {
  //   return farmErr(FARM_VALIDATION_FAILED, 'Invalid farm input');
  // }

  // For now, basic validation
  if (!input || typeof input !== 'object') {
    return farmErr(FARM_VALIDATION_FAILED, 'Invalid input');
  }

  // 2. INJECT CONTEXT (defaults, status, etc.)
  const dbInput = {
    ...input as CreateFarmInput,
    type: (input as CreateFarmInput).type || FARM_TYPE.FARM,
    verificationStatus: VERIFICATION_STATUS.PENDING_VD_APPROVAL,
    dataSource: DATA_SOURCE.MOBILE,
    isActive: true,
  };

  // 3. DELEGATE TO REPOSITORY
  const result = await this._repository.create(dbInput);
  if (result.isErr()) {
    return farmErr(FARM_DATABASE_ERROR, `Failed to create farm: ${result.error}`);
  }

  // 4. RETURN RESULT
  return result;
}
```

**Note:** Event publishing is optional and can be added later when Rocky implements an event bus.

### P4: Use Result<T, E> — Never Throw HTTP/TRPC Errors

```typescript
// ✅ CORRECT — return Result from all service methods
async verifyFarm(
  farmId: string,
  verifiedBy: string,
  note?: string,
): Promise<Result<Farm, FarmErrorCode>> {
  // Get farm
  const farmResult = await this._repository.getById(farmId);
  if (farmResult.isErr()) {
    return farmResult;
  }

  const farm = farmResult.value;
  if (!farm) {
    return farmErr(FARM_NOT_FOUND, `Farm ${farmId} not found`);
  }

  // Business rule: can only verify pending farms
  if (farm.verificationStatus !== VERIFICATION_STATUS.PENDING_VD_APPROVAL) {
    return farmErr(FARM_CANNOT_VERIFY, `Farm ${farmId} is not pending verification`);
  }

  if (farm.verificationStatus === VERIFICATION_STATUS.APPROVED) {
    return farmErr(FARM_ALREADY_VERIFIED, `Farm ${farmId} is already verified`);
  }

  // Update verification status
  const result = await this._repository.verify(farmId, verifiedBy, note);
  if (result.isErr()) {
    return farmErr(FARM_DATABASE_ERROR, `Failed to verify farm: ${result.error}`);
  }

  return result;
}
```

**Why:** Error-to-HTTP mapping belongs in the API layer (router/tRPC), not the domain layer.

### P5: Keep Dependencies Simple

```typescript
// ✅ CORRECT — simple constructor with only necessary dependencies
@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  constructor(
    private readonly _repository: FarmsRepository,
  ) {}
}
```

### P6: Use Logger for Observability

```typescript
// ✅ CORRECT — use NestJS Logger
@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
    this.logger.log('Creating farm', { input });

    const result = await this._repository.create(input);

    if (result.isOk()) {
      this.logger.log('Farm created successfully', { farmId: result.value.id });
    } else {
      this.logger.error('Failed to create farm', { error: result.error });
    }

    return result;
  }
}
```

### P7: Use Branded Enum Constants From @rocky/database

```typescript
// ✅ CORRECT — import branded enum objects
import { FARM_TYPE, VERIFICATION_STATUS, DATA_SOURCE } from '@rocky/database';

// Use in business logic
if (farm.type === FARM_TYPE.SLAUGHTERHOUSE) {
  // Special handling for slaughterhouses
}

const dbInput = {
  type: FARM_TYPE.FARM,
  verificationStatus: VERIFICATION_STATUS.PENDING_VD_APPROVAL,
};
```

### P8: Handle Repository Errors Gracefully

```typescript
// ✅ CORRECT — wrap repository errors in domain errors
async deactivate(farmId: string, updatedBy: string): Promise<Result<Farm, FarmErrorCode>> {
  const result = await this._repository.deactivate(farmId, updatedBy);

  if (result.isErr()) {
    // Translate DB error to domain error
    return farmErr(FARM_DATABASE_ERROR, `Failed to deactivate farm: ${result.error.message}`);
  }

  return result;
}
```

### P9: Keep Services Focused (≤500 lines)

```typescript
// ✅ CORRECT — split large services into focused units
// farms.service.ts — core farm CRUD and lifecycle (≤500 lines)
// farms-search.service.ts — farm search and filtering
// farms-verification.service.ts — verification workflow (if complex)
```

### P10: Translate Between API and DB Types

```typescript
// ✅ CORRECT — service translates API input → DB model
async updateFarm(farmId: string, input: unknown): Promise<Result<Farm, FarmErrorCode>> {
  // input is from API layer
  const parsed = updateFarmInputSchema.safeParse(input);
  if (!parsed.success) {
    return farmErr(FARM_VALIDATION_FAILED, 'Invalid input');
  }

  // Transform API type → DB type (inject audit fields)
  const dbUpdate = {
    ...parsed.data,
    updatedAt: new Date(),
    updatedBy: parsed.data.updatedBy,
  };

  // Repository handles DB type
  return this._repository.update(farmId, dbUpdate);
}
```

---

## ❌ Anti-Patterns (What NOT To Do)

### AP1: Never Import Database Tables/Schemas Directly

```typescript
// ❌ WRONG — services must NOT import database tables
import { farms } from "@rocky/database/schema/hk/schema";
import { eq } from "drizzle-orm";

// Direct DB query in service
const farm = await this._db.select().from(farms).where(eq(farms.id, farmId));

// ✅ CORRECT — always go through repository
import { FarmsRepository } from "./farms.repository";
const farm = await this._repository.getById(farmId);
```

**Panopticon rule:** `LAW1` — Service Isolation

### AP2: Never Import Database Zod Schemas Directly

```typescript
// ❌ WRONG — services must NOT import DB schemas
import { farmSelectSchema } from "@rocky/database/zod";

// ✅ CORRECT — use repositories for DB access
// API validators (when package exists) should be imported instead
import { FarmOutput } from "@rocky/validators/api";
```

**Panopticon rule:** `LAW1` — layer ban pattern `@rocky/database/(schemas|zod)/?`

### AP3: Never Import Error Codes From Other Domains

```typescript
// ❌ WRONG — importing error codes from another domain
import { ANIMAL_ERRORS } from "../an/animals.errors";

// ✅ CORRECT — define error codes in own domain's errors file
import { FARM_ERRORS } from "./farms.errors";
```

### AP4: Never Throw HTTP/TRPC Exceptions From Domain Code

```typescript
// ❌ WRONG — HttpException in domain layer
throw new HttpException("Farm not found", 404);

// ❌ WRONG — TRPCError in domain layer
throw new TRPCError({ code: "NOT_FOUND", message: "Farm not found" });

// ❌ WRONG — throwing raw errors
throw new Error("Farm not found");

// ✅ CORRECT — return Result<T, ErrorCode>
return farmErr(FARM_NOT_FOUND, "Farm not found");
```

**Why:** Error-to-HTTP mapping belongs in the API layer (router), not the domain layer.

### AP5: Never Use Hardcoded Enum Strings

```typescript
// ❌ WRONG — hardcoded enum strings
if (farm.type === 'SLAUGHTERHOUSE') { ... }
const input = { type: 'FARM', status: 'ACTIVE' };

// ✅ CORRECT — use branded enum constants
import { FARM_TYPE, VERIFICATION_STATUS } from '@rocky/database';
if (farm.type === FARM_TYPE.SLAUGHTERHOUSE) { ... }
const input = { type: FARM_TYPE.FARM, status: VERIFICATION_STATUS.APPROVED };
```

**Panopticon rule:** `LAW3I` — Hardcoded Enum String Detection

### AP6: Never Access Database Directly (Bypass Repository)

```typescript
// ❌ WRONG — direct DB access in service
import { db } from "@rocky/database";
const farm = await db.select().from(farms).where(eq(farms.id, farmId));

// ✅ CORRECT — always go through repository
const farm = await this._repository.getById(farmId);
```

### AP7: Never Use console.log

```typescript
// ❌ WRONG — console.log in service
console.log('Creating farm:', input);

// ✅ CORRECT — use NestJS Logger
private readonly logger = new Logger(FarmsService.name);
this.logger.log('Creating farm', { farmId });
```

### AP8: Never Skip Input Validation

```typescript
// ❌ WRONG — passing raw input to repository
async create(input: unknown) {
  return this._repository.create(input as CreateFarmInput);
}

// ✅ CORRECT — validate at service boundary
async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
  // Validate (basic for now, use Zod when validators package exists)
  if (!input || typeof input !== 'object') {
    return farmErr(FARM_VALIDATION_FAILED, 'Invalid input');
  }
  return this._repository.create(input as CreateFarmInput);
}
```

### AP9: Never Access process.env Directly

```typescript
// ❌ WRONG — direct env access in service
const apiKey = process.env.FARM_API_KEY;

// ✅ CORRECT — inject config via constructor or use ConfigService
constructor(
  @Inject('FARM_CONFIG') private readonly config: FarmConfig,
) {}
```

### AP10: Never Publish Events From Wrong Layers

```typescript
// ❌ WRONG — publishing from repository
class FarmsRepository {
  async create(data) {
    const farm = await this.save(data);
    this.eventBus.publish('farm.created', { farmId: farm.id });  // ❌ NO!
    return farm;
  }
}

// ❌ WRONG — publishing from router
@Mutation()
async createFarm(@Input() input) {
  const farm = await this.service.create(input);
  this.eventBus.publish('farm.created', { farmId: farm.id });  // ❌ NO!
  return farm;
}

// ✅ CORRECT — only services publish (when event bus is implemented)
class FarmsService {
  async create(input: unknown) {
    const result = await this._repo.create(input);
    if (result.isOk() && this._eventPublisher) {
      await this._eventPublisher.publish('farm.created', { farmId: result.value.id });
    }
    return result;
  }
}
```

**Panopticon rule:** `LAW4` — Queue Discipline

---

## File Structure Template

```typescript
/**
 * Farm Service
 *
 * Business logic for farm operations.
 * Orchestrates: validate → inject context → delegate to repo → return result.
 *
 * Diamond Seal Level 4: Domain Logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { ok, err, isSuccess, type Result } from '@rocky/errors';
import { FarmsRepository } from './farms.repository';
import {
  FARM_ERRORS,
  type FarmErrorCode,
  farmErr,
} from './farms.errors';
import { FARM_TYPE, VERIFICATION_STATUS, DATA_SOURCE } from '@rocky/database';
import type { Farm } from './farms.repository';

// ── Service ──────────────────────────────────────────────────────────────
@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);

  constructor(private readonly _repository: FarmsRepository) {}

  /**
   * Create a new farm
   */
  async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
    this.logger.log('Creating farm', { input });

    // 1. Validate input
    if (!input || typeof input !== 'object') {
      return farmErr(FARM_VALIDATION_FAILED, 'Invalid input');
    }

    // 2. Inject context
    const dbInput = {
      ...input as CreateFarmInput,
      type: (input as CreateFarmInput).type || FARM_TYPE.FARM,
      verificationStatus: VERIFICATION_STATUS.PENDING_VD_APPROVAL,
      dataSource: DATA_SOURCE.MOBILE,
      isActive: true,
    };

    // 3. Delegate to repository
    const result = await this._repository.create(dbInput);

    // 4. Handle result
    if (result.isErr()) {
      this.logger.error('Failed to create farm', { error: result.error });
      return farmErr(FARM_DATABASE_ERROR, `Failed to create farm`);
    }

    this.logger.log('Farm created successfully', { farmId: result.value.id });
    return result;
  }

  /**
   * Verify a farm
   */
  async verify(
    farmId: string,
    verifiedBy: string,
    note?: string,
  ): Promise<Result<Farm, FarmErrorCode>> {
    const farm = await this._repository.getById(farmId);
    if (!farm) {
      return farmErr(FARM_NOT_FOUND, `Farm ${farmId} not found`);
    }

    if (farm.verificationStatus === VERIFICATION_STATUS.APPROVED) {
      return farmErr(FARM_ALREADY_VERIFIED, `Farm ${farmId} already verified`);
    }

    if (farm.verificationStatus !== VERIFICATION_STATUS.PENDING_VD_APPROVAL) {
      return farmErr(FARM_CANNOT_VERIFY, `Farm ${farmId} is not pending verification`);
    }

    const result = await this._repository.verify(farmId, verifiedBy, note);
    if (result.isErr()) {
      return farmErr(FARM_DATABASE_ERROR, `Failed to verify farm`);
    }

    return result;
  }
}
```

---

## Quick Reference Card

| Do                                       | Don't                                       |
| ---------------------------------------- | ------------------------------------------- |
| Import from `@rocky/errors`             | Import from `@rocky/database` directly      |
| Import own repository                    | Import DB schemas/zod                       |
| Define own error codes                   | Import error codes from other domains        |
| Return `Result<T, E>`                    | Throw HTTP/TRPC exceptions                   |
| Validate at service boundary             | Pass raw input to repository                |
| Use NestJS `Logger`                      | Use `console.log`                           |
| Keep dependencies simple                 | Make EventPublisher required (optional only)|
| Keep ≤500 lines                          | Grow to 1000+ lines                         |
| Use branded enums (`FARM_TYPE.FARM`)     | Use hardcoded strings (`'FARM'`)            |
| Inject context defaults                 | Pass raw API input directly                  |

---

## Service vs Repository Responsibility Matrix

| Concern               | Repository              | Service                      |
| --------------------- | ----------------------- | ---------------------------- |
| DB access             | ✅ Direct (via Drizzle) | ❌ Never direct              |
| Input validation      | ❌ No                   | ✅ API schema validation     |
| Context injection     | ❌ No                   | ✅ Inject defaults/status    |
| Event publishing     | ❌ Never                | ✅ Only layer that publishes |
| Error handling        | Return `Result<T, E>`  | Return `Result<T, E>`        |
| Business logic        | ❌ No                   | ✅ Orchestration logic       |
| Type translation      | DB types                | API types ↔ DB types         |
| Logging/observability | ❌ Minimal              | ✅ Logger, spans             |

---

## Testing Guidelines

### Unit Tests (Mock Repository)

```typescript
describe('FarmsService', () => {
  let service: FarmsService;
  let mockRepository: jest.Mocked<FarmsRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new FarmsService(mockRepository);
  });

  it('should create farm with defaults', async () => {
    const input: CreateFarmInput = {
      name: 'Test Farm',
      farmId: 'MK-12345',
      addressId: 'address-id',
    };

    mockRepository.create.mockResolvedValue(ok({ ...input, id: '123' }));

    const result = await service.create(input);

    expect(result.isOk()).toBe(true);
    expect(result.value.type).toBe(FARM_TYPE.FARM);
    expect(result.value.verificationStatus).toBe(VERIFICATION_STATUS.PENDING_VD_APPROVAL);
  });

  it('should return validation error for invalid input', async () => {
    const result = await service.create(null);

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(FARM_VALIDATION_FAILED);
  });

  it('should not verify already verified farm', async () => {
    mockRepository.getById.mockResolvedValue(ok({
      id: '123',
      verificationStatus: VERIFICATION_STATUS.APPROVED,
    } as Farm));

    const result = await service.verify('123', 'user-123');

    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe(FARM_ALREADY_VERIFIED);
  });
});
```

### Integration Tests (Real Database)

```typescript
describe('FarmsService (Integration)', () => {
  let service: FarmsService;
  let repository: FarmsRepository;
  let db: Database;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new FarmsRepository();
    service = new FarmsService(repository);
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should create and verify farm', async () => {
    const input: CreateFarmInput = {
      name: 'Test Farm',
      farmId: 'MK-12345',
      addressId: 'test-address-id',
    };

    const createResult = await service.create(input);
    expect(createResult.isOk()).toBe(true);

    const verifyResult = await service.verify(
      createResult.value.id,
      'test-user',
    );
    expect(verifyResult.isOk()).toBe(true);
    expect(verifyResult.value.verificationStatus).toBe(VERIFICATION_STATUS.APPROVED);
  });
});
```

---

## Rocky-Specific Notes

### When Validators Package Exists

Once `@rocky/validators` package is created, services should import from it:

```typescript
// When validators package exists
import { createFarmInputSchema, updateFarmInputSchema, FarmOutput } from "@rocky/validators/api";

async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
  const parsed = createFarmInputSchema.safeParse(input);
  if (!parsed.success) {
    return farmErr(FARM_VALIDATION_FAILED, 'Invalid input');
  }

  return this._repository.create(parsed.data);
}
```

### When Event Bus Exists

Once Rocky implements an event bus, services can publish events:

```typescript
@Injectable()
export class FarmsService {
  constructor(
    private readonly _repository: FarmsRepository,
    @Optional()
    private readonly _eventPublisher: EventPublisher | undefined,
  ) {}

  async create(input: unknown): Promise<Result<Farm, FarmErrorCode>> {
    const result = await this._repository.create(input);

    if (result.isOk() && this._eventPublisher) {
      await this._eventPublisher.publish('farm.created', {
        farmId: result.value.id,
        timestamp: new Date(),
      });
    }

    return result;
  }
}
```

### Multi-Service Organization

Rocky organizes services by domain/schema:

```
apps/api/src/services/
├── sm/          # System management services
├── hk/          # Holding kinetics services (farms, movements)
├── an/          # Animal services (ear tags, animals)
└── index.ts     # Barrel export
```

---

## Next Steps

1. **Implement Service** — See example service implementation
2. **Run Tests** — Ensure service tests pass
3. **Update Routers** — Refactor routers to use services
4. **Add Event Bus** — When Rocky implements event publishing
5. **Add Validators** — When validators package is created

---

## Related Documentation

- `/docs/REPOSITORY_PATTERNS.md` — Repository layer patterns
- `/docs/DB_ARCHITECTURE.md` — Database schema documentation
- `/docs/AGENTS.md` — RobotFarm bot network architecture
- `/packages/database/src/` — Database schemas and constants
