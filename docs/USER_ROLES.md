# User Roles Implementation

**Date:** 2025-01-02
**Status:** ✅ Complete
**Location:** `packages/database/src/constants/user-role.ts`

## Overview

The Rocky AIMCS uses a Role-Based Access Control (RBAC) system with hierarchical roles for authorization. User roles are enforced through Row-Level Security (RLS) policies at the database level.

## Role Hierarchy

```typescript
SUPER_ADMIN (100)
  ├── Full system access
  ├── Can manage all organizations
  └── Cannot be scoped

VD_ADMIN (80)
  ├── Regional administrator access
  ├── Can manage users/roles within region
  └── Scoped by organization

VD_STAFF (60)
  ├── Staff member access
  ├── Can perform veterinarian duties
  └── Scoped by organization

FARMER (40)
  ├── Basic farm access
  ├── Can manage own farms/animals
  └── Scoped by farm ownership
```

## Database Constants

**File:** `packages/database/src/constants/user-role.ts`

```typescript
import { USER_ROLE, USER_ROLE_VALUES, hasRolePrivilege } from "@rocky/database/constants/user-role";

// Get role values
const role = USER_ROLE.SUPER_ADMIN; // "SUPER_ADMIN"

// Check privileges
hasRolePrivilege("VD_ADMIN", "VD_STAFF"); // true (80 >= 60)
hasRolePrivilege("FARMER", "VD_ADMIN"); // false (40 < 80)

// All role values
USER_ROLE_VALUES; // ["SUPER_ADMIN", "VD_ADMIN", "VD_STAFF", "FARMER"]
```

## Zod Schema Validation

**File:** `packages/validators/src/enums/user-role.ts`

```typescript
import { userRoleSchema, UserRole } from "@rocky/validators";

// Validate API input
const result = userRoleSchema.parse("SUPER_ADMIN"); // ✅
const result = userRoleSchema.parse("INVALID_ROLE"); // ❌ ZodError

// Type inference
type UserRole = "SUPER_ADMIN" | "VD_ADMIN" | "VD_STAFF" | "FARMER";
```

## Usage in Database RLS Policies

**Example:** `packages/database/src/schema/sm/users.ts`

```typescript
import { sql } from "drizzle-orm";
import { USER_ROLE } from "@rocky/database/constants/user-role";

// Using constants in RLS policies (recommended)
pgPolicy("user_access_policy", {
  using: sql`
    current_setting('app.current_role', true) IN (
      ${sql.raw(`'${USER_ROLE.SUPER_ADMIN}'`)},
      ${sql.raw(`'${USER_ROLE.VD_ADMIN}'`)}
    )
    OR id = current_setting('app.current_user_id', true)::uuid
  `,
});

// Legacy approach (hardcoded strings)
pgPolicy("user_access_policy", {
  using: sql`
    current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
    OR id = current_setting('app.current_user_id', true)::uuid
  `,
});
```

## Usage in Application Code

**Backend Authorization Check:**

```typescript
import { hasRolePrivilege, USER_ROLE } from "@rocky/database/constants/user-role";

// Check if user can perform action
function canDeleteUser(actorRole: string, targetRole: string): boolean {
  // Only SUPER_ADMIN can delete admins
  if (targetRole === USER_ROLE.VD_ADMIN) {
    return actorRole === USER_ROLE.SUPER_ADMIN;
  }

  // Can delete users with lower privilege level
  return hasRolePrivilege(actorRole, targetRole);
}

// Usage
canDeleteUser("SUPER_ADMIN", "VD_ADMIN"); // true
canDeleteUser("VD_ADMIN", "VD_STAFF"); // true
canDeleteUser("VD_STAFF", "VD_ADMIN"); // false
```

**Frontend Role Display:**

```typescript
import { USER_ROLE_VALUES } from "@rocky/database/constants/user-role";
import { userRoleSchema } from "@rocky/validators";

// Role dropdown options
const roleOptions = USER_ROLE_VALUES.map((role) => ({
  value: role,
  label: formatRoleName(role), // SUPER_ADMIN → "Super Administrator"
}));

// Validate user input
function validateRole(input: string): boolean {
  return userRoleSchema.safeParse(input).success;
}
```

## Role Scoping in user_roles Table

The `user_roles` table supports role scoping for multi-tenant access:

```typescript
// Assign regional admin role
await db.insert(userRoles).values({
  userId: "user-uuid",
  roleId: roleMap[USER_ROLE.VD_ADMIN],
  scopeOrgId: "region-1-uuid", // Only for this region
  validFrom: new Date(),
  validTo: null, // No expiry
});

// Assign temporary staff role
await db.insert(userRoles).values({
  userId: "user-uuid",
  roleId: roleMap[USER_ROLE.VD_STAFF],
  scopeOrgId: "region-1-uuid",
  validFrom: new Date("2025-01-01"),
  validTo: new Date("2025-12-31"), // Expires at year end
});

// Assign farmer role (scoped to farm)
await db.insert(userRoles).values({
  userId: "farmer-uuid",
  roleId: roleMap[USER_ROLE.FARMER],
  scopeFarmId: "farm-123-uuid", // Only this farm
  validFrom: new Date(),
  validTo: null,
});
```

## Migration from Legacy RoleName Enum

The old `enums.ts` file had a larger `RoleName` enum with roles like:
- VS_MANAGER, VETERINARIAN, TECHNICIAN, SUPPLIER, INSPECTOR
- SLAUGHTERHOUSE_OP, MARKET_OP, REPORT_VIEWER

**Migration Strategy:**

1. **Keep legacy enum for backward compatibility** in the enums.ts file
2. **Use new USER_ROLE constants** for all new code
3. **Update database roles table** to align with the 4 core roles
4. **Role Mapping:**
   - VS_MANAGER → VD_ADMIN
   - VETERINARIAN → VD_STAFF
   - FARMER → FARMER (unchanged)
   - Technical roles → Use permissions system instead

## Testing

**Unit Tests:**

```typescript
import { describe, it, expect } from "vitest";
import { USER_ROLE, hasRolePrivilege } from "@rocky/database/constants/user-role";
import { userRoleSchema } from "@rocky/validators";

describe("User Roles", () => {
  it("should have correct role values", () => {
    expect(USER_ROLE.SUPER_ADMIN).toBe("SUPER_ADMIN");
    expect(USER_ROLE.VD_ADMIN).toBe("VD_ADMIN");
    expect(USER_ROLE.VD_STAFF).toBe("VD_STAFF");
    expect(USER_ROLE.FARMER).toBe("FARMER");
  });

  it("should check privileges correctly", () => {
    expect(hasRolePrivilege("SUPER_ADMIN", "VD_ADMIN")).toBe(true);
    expect(hasRolePrivilege("VD_ADMIN", "VD_STAFF")).toBe(true);
    expect(hasRolePrivilege("VD_STAFF", "FARMER")).toBe(true);
    expect(hasRolePrivilege("FARMER", "VD_ADMIN")).toBe(false);
  });

  it("should validate roles with Zod", () => {
    expect(userRoleSchema.parse("SUPER_ADMIN")).toBe("SUPER_ADMIN");
    expect(() => userRoleSchema.parse("INVALID")).toThrow();
  });
});
```

## Files Created

1. `packages/database/src/constants/user-role.ts` - Role constants and hierarchy
2. `packages/validators/src/enums/user-role.ts` - Zod schema validation

## Files Updated

1. `packages/validators/src/enums/index.ts` - Export userRoleSchema

## Best Practices

1. ✅ **Use constants** - Always use `USER_ROLE.*` instead of hardcoded strings
2. ✅ **Check privileges** - Use `hasRolePrivilege()` for authorization
3. ✅ **Scope roles** - Use `scopeOrgId` and `scopeFarmId` for multi-tenancy
4. ✅ **Validate input** - Use `userRoleSchema.parse()` for API input
5. ✅ **Log role changes** - Audit all role assignments/revocations
6. ⚠️ **Never scope SUPER_ADMIN** - They bypass all scoping by design

## Next Steps

1. ✅ Create constants file - DONE
2. ✅ Create Zod schema - DONE
3. ⏳ Update RLS policies to use constants - TODO
4. ⏳ Seed initial roles into database - TODO
5. ⏳ Create role management API - TODO
6. ⏳ Document permission matrix - TODO

## Conclusion

The user role system is now properly typed with:
- ✅ Constants for type safety
- ✅ Zod schemas for validation
- ✅ Hierarchy for authorization checks
- ✅ Ready for database seeding

**Status:** Ready for integration into authentication and authorization flows.
