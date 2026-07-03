# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rocky** is an AIMCS (Animal Identification & Movement Control System) - a livestock tracking system for North Macedonia. This monorepo modernizes a legacy Oracle Forms/PL/SQL system, managing farms, animals, movements, and ear tags with full regulatory compliance.

**Business Domain:** Livestock tracking (cattle, sheep, goats, pigs), farm registration with GPS, animal movements/births/slaughter, ear tag lifecycle, risk analysis, and inspections. Multi-language support (MK, EN, SQ, SR).

## Development Commands

### Installation & Setup
```bash
# Install dependencies (requires pnpm 10.12.4+, Node.js 24.14.0+)
pnpm install

# Setup PostgreSQL database (see DB_ARCHITECTURE.md for schema details)
cd packages/@rocky/database
pnpm db:push       # Push schema to database
pnpm db:studio     # Open Drizzle Studio
pnpm db:migrate    # Run migrations
```

### Build & Test
```bash
# Build entire monorepo
pnpm build

# Run tests
pnpm test

# Run specific test file
pnpm test <file-path>

# Type checking
pnpm typecheck

# Linting and formatting (uses Biome)
pnpm lint
pnpm format
```

### Development Servers
```bash
# Run specific app in development mode
pnpm --filter @rocky/api dev
pnpm --filter @rocky/web dev
pnpm --filter @rocky/mobile dev

# Run all dev servers in parallel (uses turbo parallel)
pnpm dev
```

## Architecture Overview

### Monorepo Structure (Turborepo + pnpm)

```
apps/
├── api/              # NestJS backend with tRPC, Drizzle ORM, better-auth
├── web/              # Next.js admin panel (VD management)
├── mobile/           # Expo React Native field app
└── mdx-shadcn/       # Documentation site (Velite + MDX)

packages/
├── @rocky/database/  # Drizzle ORM schemas (sm, hk, an, auth, demo)
├── @rocky/validators/# Zod 4 validation layer ("Diamond Seal" patterns)
├── @rocky/ui/        # shadcn/ui component library
├── @rocky/trpc/      # tRPC router setup
├── @rocky/errors/    # Error handling with neverthrow Result types
├── @rocky/domains-todo/ # Domain services example pattern
└── @trpc/generated/  # Auto-generated tRPC types
```

### Technology Stack

**Backend:**
- NestJS with tRPC for type-safe APIs
- Drizzle ORM with PostgreSQL 16+ and PostGIS (geospatial)
- better-auth with RBAC and Row Level Security (RLS)
- Vitest + Testcontainers for integration testing

**Frontend:**
- Next.js 16 (admin) + Expo React Native (mobile)
- React 19 throughout
- Tailwind CSS 4 + shadcn/ui components
- tRPC client for type-safe API calls

**Validation & Error Handling:**
- Zod 4 with "Diamond Seal" validation patterns
- neverthrow Result<T,E> for functional error handling

### Critical Architectural Patterns

#### 1. Error Sovereignty Doctrine
Domain services return `Result<T,E>` (neverthrow), never throw. tRPC layer maps domain errors to TRPCError. This ensures domain logic remains pure and testable.

**Location:** packages/@rocky/errors/
**Pattern:**
```typescript
// Domain service
function registerFarm(data: FarmInput): Promise<Result<Farm, FarmError>> {
  // Returns Ok(farm) or Err(error)
}

// tRPC router
router.mutation('register', {
  input: FarmInputSchema,
  async resolve({ input }) {
    const result = await registerFarm(input);
    if (result.isErr()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: result.error.message });
    }
    return result.value;
  }
})
```

#### 2. Diamond Seal Validation
Three-layer validation chain ensuring type safety from API to database:

1. **Dumb Zod** - API input validation (@rocky/validators)
2. **Smart Zod** - Domain-aware validation (refines with business logic)
3. **API Zod** - Public-facing schemas with user-friendly messages

**Location:** packages/@rocky/validators/
**Flow:** API Request → Dumb Zod → Smart Zod → Database

#### 3. RobotFarm Network (AGENTS.md)
The codebase uses a "bot network" metaphor documented in AGENTS.md:
- Each domain (farm, animal, movement, ear tag) has a specialized "bot" agent
- Agents communicate via documented interfaces
- Hierarchical organization with clear responsibilities

**Read `AGENTS.md`** for the complete bot hierarchy and communication protocols.

#### 4. Row Level Security (RLS)
PostgreSQL policies enforce multi-tenant access at database level:
- Every query includes `user_id` or `organization_id` filtering
- RLS policies in `/packages/@rocky/database/drizzle/*.sql`
- Users can only access data in their scope (e.g., single VD district)

**Example:** A VD officer can only query farms in their district, enforced by RLS policy `auth.rls_farms_district()`.

#### 5. Single-Phase Movements
Movement records are unified (departure + arrival in one transaction), not separate phases. Status columns (`movement_status`, `verification_status`) track state, avoiding temp tables.

**Schema:** `sm.movement` table with `movement_status` enum.

## Database Architecture

**Connection:** PostgreSQL 16+ with PostGIS extension enabled
**Schemas:**
- `sm` - System management (users, organizations, lookups)
- `hk` - Holding kinetics (farms, movements, locations)
- `an` - Animals (ear tags, individual animals, events)
- `auth` - better-auth tables
- `demo` - Demo data

**Key Design Decisions (see DB_ARCHITECTURE.md):**
- UUIDs for all primary keys (except internal enums)
- Audit columns: `created_at`, `updated_at`, `created_by_id`
- Geospatial: `geometry` columns (PostGIS) for farm locations
- Status enums: `*_status` columns instead of temp tables
- Verification workflow: `verification_status` on movements, farms

**Documentation:**
- `DB_ARCHITECTURE.md` - Complete schema documentation and design rationale
- `AIMCS_LEGACY_ANALYSIS.md` - Legacy Oracle → Modern migration analysis

## Code Quality & Standards

**Linting/Formatting:** Biome (not ESLint/Prettier)
- Config: `biome.json`
- Custom plugin: `packages/biome-plugin-rocky/src/index.ts`
- Run `pnpm lint` and `pnpm format` before commits

**Type Safety:**
- Strict TypeScript mode enabled
- tRPC provides end-to-end type safety
- Zod schemas validate at runtime
- Run `pnpm typecheck` to verify

**Testing:**
- Vitest for unit + integration tests
- Testcontainers for PostgreSQL in tests
- Tests co-located with source files (`.test.ts` suffix)

## Key Files to Understand

- `AGENTS.md` - RobotFarm bot network and domain communication
- `DB_ARCHITECTURE.md` - Database schema and design decisions
- `AIMCS_LEGACY_ANALYSIS.md` - Legacy system migration context
- `package.json` (root) - Turbo pipeline scripts
- `turbo.json` - Build pipeline configuration
- `pnpm-workspace.yaml` - Workspace configuration

## Domain-Specific Knowledge

**Animal Movement Workflow:**
1. **Ear Tag Allocation** - Tags assigned to farms (an.ear_tag_allocation)
2. **Animal Birth/Import** - Animals registered with tags (an.animal)
3. **Movement Request** - Farmer initiates movement (hk.movement)
4. **VD Verification** - Veterinary inspector verifies (movement.verification_status)
5. **Movement Completion** - Animals arrive at destination

**Roles & Permissions:**
- **VD (Veterinary Directorate)** - Regional oversight
- **VU (Veterinary User)** - Field inspectors
- **Farmer** - Animal owners
- **Admin** - System administrators

**Multi-Language Support:**
- MK (Macedonian) - Primary
- EN (English) - Secondary
- SQ (Albanian), SR (Serbian) - Regional languages

## When Working on This Codebase

1. **Start with domain docs:** Read AGENTS.md and DB_ARCHITECTURE.md before modifying business logic
2. **Follow Result pattern:** Domain functions return `Result<T,E>`, never throw
3. **Validate with Zod:** Use Diamond Seal chain for all inputs
4. **Respect RLS:** Never bypass user_id/organization_id filtering
5. **Test with Testcontainers:** Integration tests should use real PostgreSQL, not mocks
6. **Keep types synchronized:** tRPC types are auto-generated, run `pnpm build` after schema changes

## Legacy System Context

The original AIMCS was built in Oracle Forms with PL/SQL. This modern system:
- Preserves all business rules and regulatory requirements
- Improves UX with web/mobile interfaces
- Adds geospatial capabilities (PostGIS)
- Maintains data model compatibility where possible

**Read `AIMCS_LEGACY_ANALYSIS.md`** for detailed migration notes from Oracle → PostgreSQL/Next.js.
