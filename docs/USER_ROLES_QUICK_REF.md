# User Roles - Quick Reference

## Files Created

```
packages/database/src/constants/user-role.ts          # Role constants & hierarchy
packages/validators/src/enums/user-role.ts            # Zod schema
packages/validators/src/enums/index.ts                # Updated exports
docs/USER_ROLES.md                                    # Full documentation
```

## Quick Usage

### Database Layer

```typescript
import { USER_ROLE, hasRolePrivilege } from "@rocky/database/constants/user-role";

// Constants
USER_ROLE.SUPER_ADMIN  // "SUPER_ADMIN"
USER_ROLE.VD_ADMIN     // "VD_ADMIN"
USER_ROLE.VD_STAFF     // "VD_STAFF"
USER_ROLE.FARMER       // "FARMER"

// Privilege check
hasRolePrivilege("VD_ADMIN", "VD_STAFF")  // true (80 >= 60)
hasRolePrivilege("FARMER", "VD_ADMIN")     // false (40 < 80)
```

### API Layer (Zod Validation)

```typescript
import { userRoleSchema, type UserRole } from "@rocky/validators";

// Validate input
const role = userRoleSchema.parse("SUPER_ADMIN");  // ✅
userRoleSchema.parse("INVALID");  // ❌ throws ZodError

// Type
type UserRole = "SUPER_ADMIN" | "VD_ADMIN" | "VD_STAFF" | "FARMER";
```

### RLS Policies (Database)

```typescript
import { sql } from "drizzle-orm";
import { USER_ROLE } from "@rocky/database/constants/user-role";

using: sql`
  current_setting('app.current_role', true) IN (
    ${sql.raw(`'${USER_ROLE.SUPER_ADMIN}'`)},
    ${sql.raw(`'${USER_ROLE.VD_ADMIN}'`)}
  )
`
```

## Role Hierarchy

```
SUPER_ADMIN (100)  ← Cannot be scoped, full access
  ↓
VD_ADMIN (80)      ← Scoped by organization (region)
  ↓
VD_STAFF (60)      ← Scoped by organization (region)
  ↓
FARMER (40)        ← Scoped by farm ownership
```

## Next Steps

1. ✅ Constants created
2. ✅ Zod schema created
3. ⏳ Update RLS policies to use constants
4. ⏳ Seed roles into database
5. ⏳ Create role management API

See [docs/USER_ROLES.md](./USER_ROLES.md) for complete documentation.
