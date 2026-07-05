
 ŽIŽEKIAN ANALYSIS OF THE DOCUMENTARY EVIDENCE

 [waves hands frantically] What do we have here? We have a complete Oracle Designer system from 2004 — SM.PDF, HK.PDF, three functional specs, workflows — and
 we have a modern codebase that thinks it has RBAC but suffers from fetishistic disavowal: "I know very well that I have a permissions table, but nevertheless
 I don't use it."

 Let me organize this by the three registers.

 ────────────────────────────────────────────────────────────────────────────────

 1. THE SYMBOLIC: What the Docs Say

 ### Roles from the Original System

 From the Workflow doc and SM.PDF, the original AIMCS had these actor types:

 ┌─────────────────────────┬─────────────────────────────────────────────────┬───────────────────┐
 │ Role                    │ Description                                     │ Documented In     │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ CPC / VD Admin          │ Central Processing Centre — full system control │ Workflow, SM.PDF  │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ VD Staff                │ Veterinary Department daily ops                 │ FS-HK, FS-Eartags │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Veterinary Station (VS) │ Field veterinarians — tag, register, report     │ All docs          │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Technician              │ Tagging technicians                             │ Workflow          │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Supplier                │ Ear tag manufacturer                            │ FS-Eartags        │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Slaughterhouse          │ KLA — receive & slaughter animals               │ FS-Registration   │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Market / Fair           │ Livestock markets, fairs                        │ Workflow          │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Keeper / Farmer         │ Animal holder/owner                             │ All docs          │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ BIP                     │ Border Inspection Post — import/export          │ Workflow          │
 ├─────────────────────────┼─────────────────────────────────────────────────┼───────────────────┤
 │ Trader                  │ Livestock trader                                │ Workflow          │
 └─────────────────────────┴─────────────────────────────────────────────────┴───────────────────┘

 ### What Each Can Do (from FS documents)

 Eartags Module (FS -eartags):
 - VD: Generate ear tag numbers, define supplier contingents, view all orders, cancel any order/ear tag
 - Supplier: Collect orders for printing, confirm delivery of printed tags
 - VS / Vet Station: Place orders (can enter farm id), order replacements
 - Farmer: Place orders for own farm only (farm id is hidden, auto-filled), report lost tags
 - "Ordinary" user: Sees only own/org orders

 HK Module (FS - HK_MK):
 - VD only manages addresses, farms, holders
 - Import from flat files → only VD confirms and commits to "real" tables
 - PDA data changes → only VD reviews and confirms
 - Everyone else reads

 Registration & Movements (FS - registration):
 - User must have privilege to register animals on specified farm
 - Farmers/slaughterhouses can operate on ONLY their own farm (single farm per org)
 - Others choose from list of farms they have access to
 - Pasture: only animals currently on "home" farm can go to pasture

 Workflow Document — actor responsibilities:
 - VS: Allocate first ear tags, request additional, order replacements, collect field data, apply tags
 - CPC: Organize printing, store allocations, generate reports
 - Slaughterhouse: Signal slaughter
 - Market/Fair: Communicate movements
 - VI (Inspector): On-spot inspections

 ### Permission granularity from SM.PDF Privileges Table

 The original SM_PRIVILEGES table has:
 - TYPE field — privilege type (read/write/execute)
 - GEO_LIMITED — geographically limited access
 - ID_PRIVILEGE_SUP — privilege hierarchy (parent → child privileges)
 - DEFAULT_PRIV — auto-assigned to users of that schema

 The original SM_US_HOLDINGS table has:
 - TYPE — type of access: read, write, read-write
 - KMG_MID — which farm/holding the access applies to

 ────────────────────────────────────────────────────────────────────────────────

 2. THE IMAGINARY: What We Think We Have

 We have these 8 roles in user-role.ts:

 ```
   SUPER_ADMIN, VD_ADMIN, VD_STAFF, VETERINARIAN,
   TECHNICIAN, SLAUGHTERHOUSE_OP, MARKET_OP, FARMER
 ```

 We have permissions table with resource + action.
 We have role_permissions binding.
 We have user_roles with scope fields.
 We have RLS policy helpers.

 But — and this is the crucial Hegelian inversion — we have zero seed data, zero permission checks, zero middleware enforcement. The custom session enrichment
 loads permissions into the session object, but nobody checks them. The permissions: string[] on the user session is a spectral presence — it exists in the
 Symbolic but has no effect in the Real.

 ────────────────────────────────────────────────────────────────────────────────

 3. THE REAL: What's Actually Missing

 ### 3A. Missing Roles

 ┌──────────────────────────────┬───────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 │ Missing Role                 │ Why From Docs                                             │ Impact                                                  │
 ├──────────────────────────────┼───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 │ SUPPLIER                     │ Ear tag manufacturer — collects orders, confirms delivery │ Eartag module literally can't function                  │
 ├──────────────────────────────┼───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 │ BIP (Border Inspection Post) │ Import/export control (Workflow instances 19-21)          │ Can't handle border operations                          │
 ├──────────────────────────────┼───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 │ TRADER                       │ Livestock trader (Workflow, SM.PDF system partners)       │ No support for livestock markets through intermediaries │
 └──────────────────────────────┴───────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘

 You already have SLAUGHTERHOUSE_OP and MARKET_OP but these are secondary actors. SUPPLIER is primary — without it the entire ear tag order-to-delivery
 pipeline is broken.

 ### 3B. Missing Permission Definitions (Resource:Action)

 There are zero INSERT INTO permissions seed statements. We need to define:

 ```
   HK:              hk:read, hk:write (+ confirm_import, import)
   FARMS:           farm:read, farm:write
   SUBJECTS:        subject:read, subject:write
   ADDRESSES:       address:read, address:write
   ANIMALS:         animal:register, animal:read, animal:write, animal:death
   MOVEMENTS:       movement:read, movement:write, movement:import, movement:export
   SLAUGHTER:       slaughter:read, slaughter:register
   PASTURE:         pasture:read, pasture:declare
   EARTAGS:         eartag:generate, eartag:order, eartag:order:cancel,
                    eartag:supply, eartag:collect_orders, eartag:confirm_delivery,
                    eartag:allocate, eartag:view_all_orders
   SM/USERS:        sm:users:read, sm:users:write
   SM/ROLES:        sm:roles:read, sm:roles:write
   SM/ORGS:         sm:orgs:read, sm:orgs:write
   SM/AUDIT:        sm:audit:read
   SM/SYSPARAMS:    sm:sysparams:read, sm:sysparams:write
   ANALYSIS:        analysis:read, analysis:run
   REPORTS:         report:read, report:generate
 ```

 ### 3C. No Permission Checking Middleware

 The RLS middleware (rls.middleware.ts) sets app.current_role for PostgreSQL RLS but there's no NestJS guard / tRPC middleware that checks
 session.user.permissions against the required permission for each route.

 Need: A @RequirePermission('eartag:order') decorator or tRPC middleware that:

 ```typescript
   @Router()
   class EarTagRouter {
     @Mutation({ input: placeOrderSchema })
     @RequirePermission('eartag:order')  // ← THIS DOESN'T EXIST
     async placeOrder(...) { ... }
   }
 ```

 ### 3D. No Scope Resolution

 The original system distinguishes:
 - Organization-scoped (VETERINARIAN, TECHNICIAN — can operate within their assigned org area's communes)
 - Farm-scoped (FARMER, SLAUGHTERHOUSE_OP, MARKET_OP — only their own farm(s))
 - Unlimited (SUPER_ADMIN, VD_ADMIN, VD_STAFF — see everything)

 The RLS helpers (farmInOrgArea, farmOwnedByUser, rlsForFarmColumn) are correctly defined in PostgreSQL RLS, but there's no application layer that uses
 scopeOrgId / scopeFarmId from user_roles to restrict which farm IDs a user can pass as input parameters.

 The FS is explicit: "if user comes from organization that can operate on only one farm, than only this farm id can be entered". This check must happen before
  the DB query.

 ### 3E. No Seed / Migration for Default Role → Permission Mapping

 From the original system, we can infer these default mappings:

 ┌────────────────────┬───────────────────────────────────────────────────────────────────────────┐
 │ Role               │ Should Have                                                               │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ SUPER_ADMIN        │ Everything                                                                │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ VD_ADMIN           │ Everything (same as SUPER_ADMIN minus system config)                      │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ VD_STAFF           │ Everything READ + HK write, Eartag generate/supply                        │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ VETERINARIAN       │ Animal register, death, movement write, eartag order — scoped to org area │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ TECHNICIAN         │ Animal register, eartag order, movement read — scoped to org area         │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ SUPPLIER (missing) │ Eartag collect_orders, confirm_delivery                                   │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ SLAUGHTERHOUSE_OP  │ Slaughter register, animal read — scoped to own farm only                 │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ MARKET_OP          │ Movement write (arrivals/departures at market) — scoped to own farm       │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ FARMER             │ Animal read (own), eartag order (own), movement read                      │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ BIP (missing)      │ Movement import/export                                                    │
 ├────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ TRADER (missing)   │ Movement write (for purchase/sale)                                        │
 └────────────────────┴───────────────────────────────────────────────────────────────────────────┘

 ### 3F. No Audit Log Seed

 The audit_log table exists but there's no seed data defining what actions get logged. The original system has SM_LOG_CODES with TYPE and CODE for
 categorizing log entries.

 ────────────────────────────────────────────────────────────────────────────────

 SUMMARY: What's Needed for All This to Work

 ┌─────────────┬───────────────────────────────────────────────────────────────┬──────────────────────────────────────┐
 │ Priority    │ What                                                          │ Where                                │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🔴 Critical │ Seed permissions table with all resource:action pairs         │ New migration file                   │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🔴 Critical │ Create SUPPLIER role (and potentially BIP, TRADER)            │ constants/user-role.ts + regenerator │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🔴 Critical │ Create @RequirePermission() guard/decorator for tRPC routers  │ apps/api/src/auth/                   │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟡 High     │ Seed default role→permission mappings matching the FS         │ New migration file                   │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟡 High     │ Apply permission checks to all existing tRPC routers          │ Every router file                    │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟡 High     │ Add farm-id ownership check middleware (single-farm users)    │ apps/api/src/trpc/middlewares/       │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟢 Medium   │ Add scope resolution from user_roles.scopeFarmId / scopeOrgId │ Session enrichment + middleware      │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟢 Medium   │ Create audit log action enums matching all operations         │ constants/audit-action.ts            │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🟢 Medium   │ Add SUPPLIER to RLS role groups + regenerator                 │ RLS helpers                          │
 ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────┤
 │ 🔵 Low      │ Add TRADER, BIP roles if the system needs import/export       │ constants/user-role.ts               │
 └─────────────┴───────────────────────────────────────────────────────────────┴──────────────────────────────────────┘

 The fundamental contradiction, Comrade, is that the RBAC schema is a complete symbolic structure that refers to nothing real. You have the /permissions
 table, the /role_permissions bindings, the /user_roles assignments — all perfectly typed, all compiling to zero errors — and yet no actual permission check
 is enforced anywhere in the application logic. The system is a pure ideological fantasy: the form of RBAC without its content.

 [sniff] The Real will assert itself the moment a FARMER or SLAUGHTERHOUSE_OP hits the ear tag order endpoint — because nothing, absolutely nothing, stops
 them from ordering for any farm they want.
