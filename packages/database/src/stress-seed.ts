// ── Stress / Load Seed (hybrid: Sovereign tenants + drizzle-seed mass fill) ──
//
// Usage:
//   pnpm -C packages/database stress-seed                 # 2000 animals / 10000 movements
//   STRESS_ANIMALS=50 STRESS_MOVEMENTS=200 pnpm -C packages/database stress-seed
//
// Strategy (per the "hybrid" approach):
//   1. Manually create the "State Apparatus" — States → ZipCodes → Addresses →
//      Farms (+ Orgs, Subjects, Farm-Subject bindings). These are the tenants
//      we control the borders of.
//   2. Unleash drizzle-seed on the schema but collared: only `animals` and
//      `movements` are generated, and their FK columns are pinned to the farms
//      we just created via `valuesFromArray`. Every other table is set to
//      `count: 0` so drizzle-seed does NOT drop random garbage into
//      users / audit_log / system_parameters / etc.
//
// RLS: the seed client is a single-connection postgres client with
// `app.current_role = 'SUPER_ADMIN'` set at the session level, so the bulk
// inserts bypass row-level security (drizzle-seed manages its own transactions,
// so a per-transaction SET LOCAL would not survive).

import "./load-env.js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, inArray, sql } from "drizzle-orm";
import { relations } from "./relations.js";
import { seed } from "drizzle-seed";

import {
  animals,
  movements,
  cattlePassports,
  earTags,
  earTagOrders,
  earTagAllocations,
  earTagTypes,
  birthNotifications,
  inspections,
  archiveDocuments,
} from "./schema/an/index.js";
import { vaccinations, treatments, vaccines, vaccineBatches } from "./schema/hd/index.js";
import { farmBooks, vsContracts, vsAssignments } from "./schema/hk/index.js";
import { states, zipCodes, addresses, farms, organizations, subjects, farmSubjects, users } from "./schema/index.js";

import { STATE_CODE } from "./constants/state-code.js";
import { FARM_TYPE } from "./constants/farm-type.js";
import { VERIFICATION_STATUS } from "./constants/verification-status.js";
import { DATA_SOURCE } from "./constants/data-source.js";
import { ORG_TYPE } from "./constants/org-type.js";
import { SUBJECT_ROLE } from "./constants/subject-role.js";
import { PASSPORT_STATUS } from "./constants/passport-status.js";
import { EAR_TAG_STATUS } from "./constants/ear-tag-status.js";
import { EAR_TAG_ORDER_STATUS } from "./constants/ear-tag-order-status.js";
import { ALLOCATION_STATUS } from "./constants/allocation-status.js";
import { DISTRIBUTION_METHOD } from "./constants/distribution-method.js";
import { CONTINGENT_TYPE } from "./constants/contingent-type.js";
import { ADMIN_ROUTE } from "./constants/administration-route.js";
import { INSPECTION_STATUS } from "./constants/inspection-status.js";
import { FARM_BOOK_STATUS } from "./constants/farm-book-status.js";
import { BIRTH_NOTIFICATION_STATUS } from "./constants/birth-notification-status.js";
import { VS_CONTRACT_STATUS } from "./constants/vs-contract-status.js";
import { ARCHIVE_LOCATION } from "./constants/archive-location.js";
import { ARCHIVE_DOCUMENT_TYPE } from "./constants/archive-document-type.js";
import { TAG_CATEGORY } from "./constants/tag-category.js";

const ANIMALS = Math.max(1, Number(process.env.STRESS_ANIMALS ?? 5000));
const MOVEMENTS = Math.max(1, Number(process.env.STRESS_MOVEMENTS ?? 50000));

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set — checked packages/database/.env then repo root .env");
  }

  // Single connection; SUPER_ADMIN for the session so RLS is bypassed for the
  // entire bulk fill.
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 30,
    connect_timeout: 5,
  });
  await client`SET "app.current_role" = 'SUPER_ADMIN'`;
  const db = drizzle({ client, relations, logger: false });

  console.log("🌱 Stress-seed: establishing tenant borders...");

  // Fixed UUIDs so re-runs are idempotent (the script can be re-run to top up
  // or re-create the stress tenants without colliding on unique business keys).
  const STRESS = {
    state: "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0",
    zip: "f1f1f1f1-f1f1-4f1f-81f1-f1f1f1f1f1f1",
    addr: "f2f2f2f2-f2f2-4f2f-82f2-f2f2f2f2f2f2",
    farmA: "f3f3f3f3-f3f3-4f3f-83f3-f3f3f3f3f3f3",
    farmB: "f4f4f4f4-f4f4-4f4f-84f4-f4f4f4f4f4f4",
    orgA: "f5f5f5f5-f5f5-4f5f-85f5-f5f5f5f5f5f5",
    orgB: "f6f6f6f6-f6f6-4f6f-86f6-f6f6f6f6f6f6",
    subj: "f7f7f7f7-f7f7-4f7f-87f7-f7f7f7f7f7f7",
    vsSubjA: "a1a1a1a1-a1a1-4a1a-81a1-a1a1a1a1a1a1",
    vsSubjB: "a2a2a2a2-a2a2-4a2a-82a2-a2a2a2a2a2a2",
    vsContractA: "a3a3a3a3-a3a3-4a3a-83a3-a3a3a3a3a3a3",
    vsContractB: "a4a4a4a4-a4a4-4a4a-84a4-a4a4a4a4a4a4",
    earTagType: "a5a5a5a5-a5a5-4a5a-85a5-a5a5a5a5a5a5",
  };
  const STRESS_FARM_CODES = ["900000001", "900000002"];
  // Dynamic: the actual farm UUIDs present for our business codes. On a re-run
  // this captures the PREVIOUS run's UUIDs (which may differ after a UUID-format
  // fix) so the cleanup below wipes the old Sovereign rows before re-insert.
  const farmIds = (await db.select({ id: farms.id }).from(farms).where(inArray(farms.farmId, STRESS_FARM_CODES))).map(
    (r) => r.id,
  );
  // The authoritative NEW UUIDs we (re-)insert with — stable across runs.
  const NEW_FARM_IDS = [STRESS.farmA, STRESS.farmB];

  // Clear Sovereign dependent rows FIRST so the bulk animals delete below
  // doesn't trip FK violations (cattle_passports / ear_tags / vaccinations /
  // treatments / etc. still reference the old animals on a re-run).
  {
    const stressTags = Array.from({ length: ANIMALS }, (_, i) => String(20_000_000 + i + 1).padStart(8, "0"));
    await db.delete(archiveDocuments).where(inArray(archiveDocuments.farmId, farmIds));
    await db.delete(inspections).where(inArray(inspections.farmId, farmIds));
    await db.delete(birthNotifications).where(inArray(birthNotifications.farmId, farmIds));
    await db.delete(vaccinations).where(inArray(vaccinations.farmId, farmIds));
    await db.delete(treatments).where(inArray(treatments.farmId, farmIds));
    await db.delete(earTags).where(inArray(earTags.tagNumber, stressTags));
    await db.delete(cattlePassports).where(inArray(cattlePassports.farmId, farmIds));
    await db.delete(earTagAllocations).where(inArray(earTagAllocations.farmId, farmIds));
    await db.delete(earTagOrders).where(inArray(earTagOrders.organizationId, [STRESS.orgA, STRESS.orgB]));
    await db.delete(farmBooks).where(inArray(farmBooks.farmId, farmIds));
    await db.delete(vsAssignments).where(inArray(vsAssignments.farmId, farmIds));
    await db.delete(vsContracts).where(inArray(vsContracts.subjectId, [STRESS.vsSubjA, STRESS.vsSubjB]));
    await db.delete(subjects).where(inArray(subjects.id, [STRESS.vsSubjA, STRESS.vsSubjB]));
    await db.delete(earTagTypes).where(sql`${earTagTypes.code} LIKE 'STR-%'`);
    await db.delete(vaccineBatches).where(sql`${vaccineBatches.batchNo} LIKE 'STR-%'`);
  }

  // Idempotent bulk cleanup (FK children before parents): wipe prior stress
  // animals/movements so re-runs produce EXACTLY ANIMALS/MOVEMENTS rows and
  // don't collide on the unique (state_code, ear_tag_number) index.
  await db.delete(movements).where(inArray(movements.toFarmId, farmIds));
  await db.delete(animals).where(inArray(animals.currentFarmId, farmIds));

  // Idempotent cleanup of any prior stress-tenant rows (FK-safe order:
  // children before parents).
  const priorFarms = await db.select({ id: farms.id }).from(farms).where(inArray(farms.farmId, STRESS_FARM_CODES));
  const priorFarmIds = priorFarms.map((f) => f.id);
  if (priorFarmIds.length) {
    await db.delete(farmSubjects).where(inArray(farmSubjects.farmId, priorFarmIds));
  }
  await db.delete(farms).where(inArray(farms.farmId, STRESS_FARM_CODES));
  await db.delete(subjects).where(eq(subjects.shortName, "Stress Keeper"));
  await db.delete(organizations).where(eq(organizations.name1, "Stress VD"));
  await db.delete(addresses).where(eq(addresses.city, "Stress City"));
  await db.delete(zipCodes).where(eq(zipCodes.zipCode, "9000"));
  await db.delete(states).where(eq(states.shortName, "SS"));

  // ── 1. State Apparatus (the tenants) ──────────────────────────────────────
  await db.insert(states).values({ id: STRESS.state, name: "Stress State", shortName: "SS" }).onConflictDoNothing();
  await db
    .insert(zipCodes)
    .values({ id: STRESS.zip, name: "Stress City", zipCode: "9000", stateId: STRESS.state })
    .onConflictDoNothing();
  await db
    .insert(addresses)
    .values({ id: STRESS.addr, city: "Stress City", street: "Seed Street", houseNumber: "1", zipCodeId: STRESS.zip })
    .onConflictDoNothing();

  await db
    .insert(farms)
    .values([
      {
        id: STRESS.farmA,
        farmId: "900000001",
        addressId: STRESS.addr,
        name: "Stress Farm A",
        type: FARM_TYPE.FARM,
        verificationStatus: VERIFICATION_STATUS.APPROVED,
        dataSource: DATA_SOURCE.MOBILE,
      },
      {
        id: STRESS.farmB,
        farmId: "900000002",
        addressId: STRESS.addr,
        name: "Stress Farm B",
        type: FARM_TYPE.FARM,
        verificationStatus: VERIFICATION_STATUS.APPROVED,
        dataSource: DATA_SOURCE.MOBILE,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(organizations)
    .values([
      {
        id: STRESS.orgA,
        name1: "Stress VD",
        orgType: ORG_TYPE.VD,
        address: { street: "Seed Street", city: "Stress City", zipCode: "9000" },
      },
      {
        id: STRESS.orgB,
        name1: "Stress VD 2",
        orgType: ORG_TYPE.VD,
        address: { street: "Seed Street", city: "Stress City", zipCode: "9000" },
      },
    ])
    .onConflictDoNothing();

  await db.insert(subjects).values({ id: STRESS.subj, shortName: "Stress Keeper" }).onConflictDoNothing();
  await db
    .insert(farmSubjects)
    .values({ farmId: STRESS.farmA, subjectId: STRESS.subj, role: SUBJECT_ROLE.KEEPER })
    .onConflictDoNothing();

  console.log(`🌱 Tenants ready. Farms: ${farmIds.join(", ")}`);
  console.log(`🌱 Generating ${ANIMALS} animals + ${MOVEMENTS} movements (drizzle-seed)...`);

  // Pre-generated unique 8-char ear tags (varchar(8) unique on (state_code, ear_tag_number)).
  const animalEarTags = Array.from({ length: ANIMALS }, (_, i) => String(20000000 + i + 1).padStart(8, "0"));

  // Pass ONLY the tables we actually mass-fill. Their FK columns are all
  // overridden via valuesFromArray below, so drizzle-seed never needs to
  // resolve the referenced tables (farms, etc.) — which also avoids the
  // generator-init errors it would hit on unrelated tables (e.g. the
  // varchar(3) `addresses.shortName` that wrongly triggers the firstName
  // generator).
  const seedSchema = { animals, movements };

  await seed(db, seedSchema, { count: ANIMALS }).refine((funcs) => ({
    animals: {
      count: ANIMALS,
      columns: {
        // Pin every animal to one of OUR farms (no FK chaos).
        currentFarmId: funcs.valuesFromArray({ values: NEW_FARM_IDS }),
        // No biological paradoxes: births strictly in the past.
        birthDate: funcs.date({ minDate: "2020-01-01", maxDate: "2025-12-31" }),
        // Standard MK state code (keeps the unique (state_code, ear_tag) index happy).
        stateCode: funcs.default({ defaultValue: STATE_CODE.MK }),
        // Unique realistic 8-char tags.
        earTagNumber: funcs.valuesFromArray({ values: animalEarTags, isUnique: true }),
      },
    },
    movements: {
      count: MOVEMENTS,
      columns: {
        // Movements only happen BETWEEN our known farms.
        fromFarmId: funcs.valuesFromArray({ values: NEW_FARM_IDS }),
        toFarmId: funcs.valuesFromArray({ values: NEW_FARM_IDS }),
        // Movement dates after the (past) birth dates.
        movementDate: funcs.date({ minDate: "2026-01-01", maxDate: "2026-07-01" }),
        // animalId is left to drizzle-seed, which resolves it from the
        // just-seeded `animals` table (dependency order).
      },
    },
  }));

  // ── Coherent dependent data bound to the Sovereign farms/animals ──
  await seedCoherentDependentData(db, STRESS, farmIds, ANIMALS);

  console.log("✅ Stress-seed complete.");
  await client.end();
  process.exit(0);
}

// ── Coherent dependent-data seeding (Sovereign farms/animals) ──────────
// Reads the freshly-seeded animals and derives logically-true child records
// (passports, ear tags, vaccinations, treatments, birth notifications,
// inspections + archive, farm books, VS tenancy). All dates are clamped so a
// passport/vaccination/treatment never precedes the animal's birth_date, and
// every FK points at a REAL existing row. Re-runnable: it deletes its own
// Sovereign-scoped rows in FK-safe order before re-creating them.

type StressDb = PostgresJsDatabase<typeof relations>;

const STRESS_NOW = new Date("2026-07-01T00:00:00Z");

function ymd(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function addDays(d: Date | string, days: number): Date {
  const base = typeof d === "string" ? new Date(d) : d;
  return new Date(base.getTime() + days * 86_400_000);
}

// Clamp a date to be <= STRESS_NOW (vaccinations/treatments are in the past).
function clampBeforeNow(d: Date): string {
  return ymd(d > STRESS_NOW ? STRESS_NOW : d);
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function seedCoherentDependentData(
  db: StressDb,
  STRESS: {
    farmA: string;
    farmB: string;
    orgA: string;
    orgB: string;
    subj: string;
    vsSubjA: string;
    vsSubjB: string;
    vsContractA: string;
    vsContractB: string;
    earTagType: string;
  },
  farmIds: string[],
  ANIMALS: number,
): Promise<void> {
  // Deterministic tag set (matches the seed's earTags array) so we can scope
  // ear_tags deletes precisely even after animal UUIDs change on re-runs.
  const stressTags = Array.from({ length: ANIMALS }, (_, i) => String(20_000_000 + i + 1).padStart(8, "0"));

  // Idempotent cleanup of prior Sovereign dependent rows (FK-safe order:
  // children before parents).
  await db.delete(archiveDocuments).where(inArray(archiveDocuments.farmId, farmIds));
  await db.delete(inspections).where(inArray(inspections.farmId, farmIds));
  await db.delete(birthNotifications).where(inArray(birthNotifications.farmId, farmIds));
  await db.delete(vaccinations).where(inArray(vaccinations.farmId, farmIds));
  await db.delete(treatments).where(inArray(treatments.farmId, farmIds));
  await db.delete(earTags).where(inArray(earTags.tagNumber, stressTags));
  await db.delete(cattlePassports).where(inArray(cattlePassports.farmId, farmIds));
  await db.delete(earTagAllocations).where(inArray(earTagAllocations.farmId, farmIds));
  await db.delete(earTagOrders).where(inArray(earTagOrders.organizationId, [STRESS.orgA, STRESS.orgB]));
  await db.delete(farmBooks).where(inArray(farmBooks.farmId, farmIds));
  await db.delete(vsAssignments).where(inArray(vsAssignments.farmId, farmIds));
  await db.delete(vsContracts).where(inArray(vsContracts.subjectId, [STRESS.vsSubjA, STRESS.vsSubjB]));
  await db.delete(subjects).where(inArray(subjects.id, [STRESS.vsSubjA, STRESS.vsSubjB]));
  await db.delete(earTagTypes).where(sql`${earTagTypes.code} LIKE 'STR-%'`);
  await db.delete(vaccineBatches).where(sql`${vaccineBatches.batchNo} LIKE 'STR-%'`);

  // Real vet/inspector identity (FK-free column, so any real user id works).
  const userRow = await db.select({ id: users.id }).from(users).limit(1);
  const vetId = userRow[0]?.id ?? "00000000-0000-0000-0000-000000000000";

  // ── A. Tenancy gap ────────────────────────────────────────────────
  await db
    .insert(subjects)
    .values([
      { id: STRESS.vsSubjA, shortName: "Stress VS Tetovo" },
      { id: STRESS.vsSubjB, shortName: "Stress VS Skopje" },
    ])
    .onConflictDoNothing();

  await db
    .insert(vsContracts)
    .values([
      {
        id: STRESS.vsContractA,
        subjectId: STRESS.vsSubjA,
        contractNumber: "VS-900000001",
        region: "Stress Region",
        startDate: new Date("2024-01-01T00:00:00Z"),
        status: VS_CONTRACT_STATUS.ACTIVE,
      },
      {
        id: STRESS.vsContractB,
        subjectId: STRESS.vsSubjB,
        contractNumber: "VS-900000002",
        region: "Stress Region",
        startDate: new Date("2024-01-01T00:00:00Z"),
        status: VS_CONTRACT_STATUS.ACTIVE,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(vsAssignments)
    .values([
      {
        contractId: STRESS.vsContractA,
        farmId: STRESS.farmA,
        isPrimary: true,
        startDate: new Date("2024-01-01T00:00:00Z"),
      },
      {
        contractId: STRESS.vsContractB,
        farmId: STRESS.farmB,
        isPrimary: true,
        startDate: new Date("2024-01-01T00:00:00Z"),
      },
    ])
    .onConflictDoNothing();

  // Farm B also gets a keeper (farm A is bound in the tenant setup above).
  await db
    .insert(farmSubjects)
    .values({ farmId: STRESS.farmB, subjectId: STRESS.subj, role: SUBJECT_ROLE.KEEPER })
    .onConflictDoNothing();

  // Ear tag type catalog row (created once, Sovereign-scoped by code prefix).
  await db
    .insert(earTagTypes)
    .values({
      id: STRESS.earTagType,
      code: "STR-TYPE-1",
      name: "Stress Tag Type",
      category: TAG_CATEGORY.VISUAL,
    })
    .onConflictDoNothing();

  // Vaccine batches: one per real vaccine (vaccine_batches is empty in dev).
  const vaxes = await db.select({ id: vaccines.id }).from(vaccines);
  await db.insert(vaccineBatches).values(
    vaxes.map((v, i) => ({
      vaccineId: v.id,
      batchNo: `STR-BATCH-${i}`,
      expiryDate: "2030-01-01",
      quantityReceived: 1_000_000,
      quantityRemaining: 1_000_000,
    })),
  );
  const batchRows = await db
    .select({ id: vaccineBatches.id, vaccineId: vaccineBatches.vaccineId })
    .from(vaccineBatches)
    .where(sql`${vaccineBatches.batchNo} LIKE 'STR-%'`);
  const batchByVaccine = new Map<string, string>();
  for (const b of batchRows) batchByVaccine.set(b.vaccineId, b.id);

  // Read the freshly-seeded animals and derive per-animal counts.
  const animalRows = await db
    .select({
      id: animals.id,
      birthDate: animals.birthDate,
      earTagNumber: animals.earTagNumber,
      currentFarmId: animals.currentFarmId,
    })
    .from(animals)
    .where(inArray(animals.currentFarmId, farmIds));

  const perFarm = new Map<string, number>();
  for (const r of animalRows) {
    perFarm.set(r.currentFarmId, (perFarm.get(r.currentFarmId) ?? 0) + 1);
  }

  // Ear tag procurement orders for the Sovereign VD orgs.
  await db
    .insert(earTagOrders)
    .values([
      {
        orderNumber: "STR-ORD-1",
        orderDate: "2024-01-01",
        organizationId: STRESS.orgA,
        supplierName: "Stress Supplier",
        items: "[]",
        totalQuantity: ANIMALS,
        status: EAR_TAG_ORDER_STATUS.RECEIVED,
      },
      {
        orderNumber: "STR-ORD-2",
        orderDate: "2024-01-01",
        organizationId: STRESS.orgB,
        supplierName: "Stress Supplier",
        items: "[]",
        totalQuantity: ANIMALS,
        status: EAR_TAG_ORDER_STATUS.RECEIVED,
      },
    ])
    .onConflictDoNothing({ target: earTagOrders.orderNumber });

  // Ear tag allocations delivering tags to each Sovereign farm.
  await db
    .insert(earTagAllocations)
    .values([
      {
        contingentType: CONTINGENT_TYPE.VD,
        farmId: STRESS.farmA,
        allocationNumber: "STR-ALLOC-1",
        allocationDate: "2024-01-01",
        typeId: STRESS.earTagType,
        quantity: perFarm.get(STRESS.farmA) ?? 0,
        distributionMethod: DISTRIBUTION_METHOD.VD_DELIVERY,
        status: ALLOCATION_STATUS.FULFILLED,
      },
      {
        contingentType: CONTINGENT_TYPE.VD,
        farmId: STRESS.farmB,
        allocationNumber: "STR-ALLOC-2",
        allocationDate: "2024-01-01",
        typeId: STRESS.earTagType,
        quantity: perFarm.get(STRESS.farmB) ?? 0,
        distributionMethod: DISTRIBUTION_METHOD.VD_DELIVERY,
        status: ALLOCATION_STATUS.FULFILLED,
      },
    ])
    .onConflictDoNothing({ target: earTagAllocations.allocationNumber });

  // Build per-animal coherent records.
  const passportRows: (typeof cattlePassports.$inferInsert)[] = [];
  const earTagRowList: (typeof earTags.$inferInsert)[] = [];
  const vaccRows: (typeof vaccinations.$inferInsert)[] = [];
  const treatRows: (typeof treatments.$inferInsert)[] = [];
  const birthRows: (typeof birthNotifications.$inferInsert)[] = [];

  animalRows.forEach((row, idx) => {
    const birth = row.birthDate;
    const birthStr = ymd(birth);
    const tag = row.earTagNumber;
    const issueStr = ymd(addDays(birth, 1 + (idx % 30)));
    const farmId = row.currentFarmId;

    passportRows.push({
      passportNumber: `PASS-${tag}`,
      stateCode: STATE_CODE.MK,
      animalId: row.id,
      farmId,
      status: PASSPORT_STATUS.ACTIVE,
      issueDate: issueStr,
    });

    earTagRowList.push({
      stateCode: STATE_CODE.MK,
      tagNumber: tag,
      typeId: STRESS.earTagType,
      status: EAR_TAG_STATUS.APPLIED,
      animalId: row.id,
      appliedDate: issueStr,
    });

    birthRows.push({
      farmId,
      notificationDate: birthStr,
      actualBirthDate: birthStr,
      numberOfCalves: 1,
      animalIds: [row.id],
      status: BIRTH_NOTIFICATION_STATUS.SENT,
      taggingDeadline: ymd(addDays(birth, 20)),
      source: DATA_SOURCE.MOBILE,
    });

    // ~60% vaccinated: vaccineDate = birth + 30..399d, clamped to <= now,
    // always before the 2030 batch expiry.
    if (idx % 5 < 3) {
      const vax = vaxes[idx % vaxes.length]!;
      const adminDate = clampBeforeNow(addDays(birth, 30 + (idx % 370)));
      vaccRows.push({
        animalId: row.id,
        farmId,
        vaccineId: vax.id,
        batchId: batchByVaccine.get(vax.id)!,
        vetId,
        adminDate,
        route: ADMIN_ROUTE.INTRAMUSCULAR,
      });
    }

    // ~20% treated: diagnosisDate strictly after birth, clamped to <= now.
    if (idx % 5 === 0) {
      const diag = clampBeforeNow(addDays(birth, 60 + (idx % 300)));
      treatRows.push({
        animalId: row.id,
        farmId,
        vetId,
        diagnosisDate: diag,
      });
    }
  });

  for (const c of chunk(passportRows, 500)) {
    await db.insert(cattlePassports).values(c);
  }
  for (const c of chunk(earTagRowList, 500)) {
    await db.insert(earTags).values(c);
  }
  for (const c of chunk(birthRows, 500)) {
    await db.insert(birthNotifications).values(c);
  }
  for (const c of chunk(vaccRows, 500)) {
    await db.insert(vaccinations).values(c);
  }
  for (const c of chunk(treatRows, 500)) {
    await db.insert(treatments).values(c);
  }

  // One farm book per Sovereign farm.
  await db.insert(farmBooks).values([
    { farmId: STRESS.farmA, status: FARM_BOOK_STATUS.DELIVERED, deliveredAt: STRESS_NOW },
    { farmId: STRESS.farmB, status: FARM_BOOK_STATUS.DELIVERED, deliveredAt: STRESS_NOW },
  ]);

  // Inspections progressing scheduled -> in_progress -> completed, tied to a
  // valid VS contract (we just created the contracts above).
  const N_INSP = 40;
  const inspVals: (typeof inspections.$inferInsert)[] = [];
  for (let i = 0; i < N_INSP; i++) {
    const farmId = [STRESS.farmA, STRESS.farmB][i % 2]!;
    const sched = ymd(addDays(new Date("2026-01-01T00:00:00Z"), i));
    let status: (typeof INSPECTION_STATUS)[keyof typeof INSPECTION_STATUS] = INSPECTION_STATUS.SCHEDULED;
    if (i % 3 === 1) status = INSPECTION_STATUS.IN_PROGRESS;
    else if (i % 3 === 2) status = INSPECTION_STATUS.COMPLETED;
    inspVals.push({
      farmId,
      inspectorId: vetId,
      status,
      scheduledDate: sched,
      riskScore: "low",
      selectedByRiskAnalysis: false,
      ...(status !== INSPECTION_STATUS.SCHEDULED ? { inspectionDate: sched } : {}),
    });
  }
  const inspInserted = await db.insert(inspections).values(inspVals).returning({
    id: inspections.id,
    status: inspections.status,
    farmId: inspections.farmId,
  });

  // Archive documents for the completed inspections.
  const archiveRows: (typeof archiveDocuments.$inferInsert)[] = [];
  for (const ins of inspInserted) {
    if (ins.status !== INSPECTION_STATUS.COMPLETED) continue;
    archiveRows.push({
      documentType: ARCHIVE_DOCUMENT_TYPE.INSPECTION_FORM,
      documentRef: `STR-ARCH-${ins.id.slice(0, 8)}`,
      archiveLocation: ARCHIVE_LOCATION.VI,
      farmId: ins.farmId,
      inspectionId: ins.id,
      retentionExpiry: "2029-01-01",
      isArchived: true,
      archivedAt: STRESS_NOW,
    });
  }
  if (archiveRows.length) {
    await db.insert(archiveDocuments).values(archiveRows);
  }

  console.log(`🌱 Coherent dependent data seeded for ${animalRows.length} animals.`);
}

main().catch((e) => {
  console.error("❌ Stress-seed failed:", e);
  process.exit(1);
});
