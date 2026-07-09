// ── Populate Demo Data ──
// Run: pnpm -C packages/testing populate
//
// Generates demo farms, animals, movements, inspections, passports and
// ear-tag orders using THIS package's factories so the admin UI isn't
// empty during local development.
//
// FK chain (insert order):
//   state → zipCode → addresses → farms → animals
//   animals + farms → movements / inspections / passports
//   organization + user → ear-tag orders
//
// Audit columns (createdBy/updatedBy/validTo) are nullable, so factory
// records insert cleanly with nulls.
//
// Idempotent per-entity: each table is only seeded if it is currently
// empty, so re-running tops up missing entities without duplicates.
// For a fully fresh dataset run scripts/db-recreate.sh first.

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import {
  AddressFactory,
  AnimalFactory,
  FarmFactory,
  MovementFactory,
  InspectionFactory,
  CattlePassportFactory,
  EarTagOrderFactory,
  OrganizationFactory,
} from "./factory/index.js";

// Load the database's .env (DATABASE_URL) regardless of cwd, BEFORE importing
// @rocky/database (its client reads process.env.DATABASE_URL at import time).
config({ path: fileURLToPath(new URL("../../database/.env", import.meta.url)) });

async function main() {
  const {
    db,
    states,
    zipCodes,
    addresses,
    farms,
    animals,
    movements,
    inspections,
    users,
    organizations,
    earTagOrders,
    cattlePassports,
  } = await import("@rocky/database");

  // ── Tier 1: base hierarchy (only on a fresh DB) ──
  const [existingAnimal] = await db.select({ id: animals.id }).from(animals).limit(1);
  if (!existingAnimal) {
    // 1. State
    const [existingState] = await db.select({ id: states.id }).from(states).limit(1);
    let stateId: string;
    if (existingState) {
      stateId = existingState.id;
    } else {
      const inserted = await db
        .insert(states)
        .values({ name: "Demo State", shortName: "DS" })
        .returning({ id: states.id });
      const row = inserted[0];
      if (!row) throw new Error("Failed to create demo state");
      stateId = row.id;
    }
    console.log("➕ resolved state");

    // 2. ZipCode
    const [existingZip] = await db.select({ id: zipCodes.id }).from(zipCodes).limit(1);
    let zipCodeId: string;
    if (existingZip) {
      zipCodeId = existingZip.id;
    } else {
      const inserted = await db
        .insert(zipCodes)
        .values({ name: "Demo City", zipCode: "10000", stateId })
        .returning({ id: zipCodes.id });
      const row = inserted[0];
      if (!row) throw new Error("Failed to create demo zipCode");
      zipCodeId = row.id;
    }
    console.log("➕ resolved zipCode");

    // 3. Addresses
    const addressRecords = Array.from({ length: 4 }, () => new AddressFactory(zipCodeId).createActive());
    const insertedAddresses = await db
      .insert(addresses)
      .values(addressRecords)
      .returning({ id: addresses.id });
    console.log(`➕ created ${insertedAddresses.length} addresses`);

    // 4. Farms
    const farmRecords = insertedAddresses.map((a, i) =>
      new FarmFactory(a.id).createActive({ name: `Demo Farm ${i + 1}` }),
    );
    const insertedFarms = await db.insert(farms).values(farmRecords).returning({ id: farms.id });
    console.log(`➕ created ${insertedFarms.length} farms`);

    // 5. Animals
    const animalRecords = Array.from({ length: 40 }, (_, i) => {
      const farm = insertedFarms[i % insertedFarms.length]!;
      return new AnimalFactory(farm.id).createAlive({ earTagNumber: String(10000000 + i) });
    });
    await db.insert(animals).values(animalRecords);
    console.log(`➕ created ${animalRecords.length} animals`);
  } else {
    console.log("ℹ️  animals already exist — skipping base hierarchy seeding.");
  }

  // Fetch existing parents for child entities.
  const allAnimals = await db.select({ id: animals.id }).from(animals);
  const allFarms = await db.select({ id: farms.id }).from(farms);
  if (allAnimals.length === 0 || allFarms.length === 0) {
    console.log("⚠️  no animals/farms available — cannot seed child entities.");
    return;
  }

  // ── Tier 2: movements ──
  const [existingMovement] = await db.select({ id: movements.id }).from(movements).limit(1);
  if (!existingMovement) {
    const movementRecords = Array.from({ length: 15 }, (_, i) => {
      const animal = allAnimals[i % allAnimals.length]!;
      const toFarm = allFarms[i % allFarms.length]!;
      const fromFarm = allFarms[(i + 1) % allFarms.length]!;
      return new MovementFactory(animal.id, toFarm.id, fromFarm.id).createTransfer();
    });
    await db.insert(movements).values(movementRecords);
    console.log(`➕ created ${movementRecords.length} movements`);
  } else {
    console.log("ℹ️  movements already exist — skipping.");
  }

  // ── Tier 3: inspections (need a vet user as inspector) ──
  const [vet] = await db.select({ id: users.id }).from(users).limit(1);
  const [existingInspection] = await db.select({ id: inspections.id }).from(inspections).limit(1);
  if (!existingInspection) {
    if (!vet) {
      console.log("⚠️  no vet user found — skipping inspections.");
    } else {
      const inspectionRecords = Array.from({ length: 12 }, (_, i) => {
        const farm = allFarms[i % allFarms.length]!;
        return new InspectionFactory(farm.id, vet.id).createScheduled();
      });
      await db.insert(inspections).values(inspectionRecords);
      console.log(`➕ created ${inspectionRecords.length} inspections`);
    }
  } else {
    console.log("ℹ️  inspections already exist — skipping.");
  }

  // ── Tier 4: passports ──
  const [existingPassport] = await db.select({ id: cattlePassports.id }).from(cattlePassports).limit(1);
  if (!existingPassport) {
    const passportRecords = Array.from({ length: 20 }, (_, i) => {
      const animal = allAnimals[i % allAnimals.length]!;
      const farm = allFarms[i % allFarms.length]!;
      return new CattlePassportFactory(animal.id, farm.id).createIssued();
    });
    await db.insert(cattlePassports).values(passportRecords);
    console.log(`➕ created ${passportRecords.length} passports`);
  } else {
    console.log("ℹ️  passports already exist — skipping.");
  }

  // ── Tier 5: ear-tag orders (need an org + a user) ──
  let orgRow = (await db.select({ id: organizations.id }).from(organizations).limit(1))[0];
  if (!orgRow) {
    const orgRec = new OrganizationFactory().createVD({ name1: "Demo Veterinary District" });
    const inserted = await db
      .insert(organizations)
      .values({
        ...orgRec,
        address: { street: "1 Vet Street", city: "Demo City", zipCode: "10000" },
      })
      .returning({ id: organizations.id });
    orgRow = inserted[0];
    if (orgRow) console.log("➕ created demo organization");
  }
  const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
  const [existingOrder] = await db.select({ id: earTagOrders.id }).from(earTagOrders).limit(1);
  if (!existingOrder) {
    if (!orgRow || !anyUser) {
      console.log("⚠️  missing organization/user — skipping ear-tag orders.");
    } else {
      const orderRecords = Array.from({ length: 5 }, () =>
        new EarTagOrderFactory(orgRow!.id, anyUser.id).createReceived(),
      );
      await db.insert(earTagOrders).values(orderRecords);
      console.log(`➕ created ${orderRecords.length} ear-tag orders`);
    }
  } else {
    console.log("ℹ️  ear-tag orders already exist — skipping.");
  }

  console.log("✅ Demo data sync complete — the admin UI should be populated.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
