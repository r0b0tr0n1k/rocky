// ── Offline Subsystem Doctrine Test (WO-082 / ADR-0036) ──
//
// A doc-test in the spirit of `verify-result-doctrine.mjs`: it proves the
// mobile offline contract documented in `apps/mob/AGENTS.md` is not ideology —
// its named files exist, its named symbols are REAL exports (no phantom
// symbols), its ADR cross-links resolve, and the subsystem's orchestration
// logic actually behaves as the contract claims.
//
// The phone is a castrated client (raw expo-sqlite, no ORM — ADR-0036 §WO-081
// d1). The native deps (`expo-sqlite`, `expo-secure-store`) are redirected to
// in-memory fakes via `tsconfig.offline-test.json` (`paths`) so the REAL
// `lib/offline/*.ts` logic runs under Node + tsx without a native runtime.
//
// Run it:
//   TSX_TSCONFIG_PATH=scripts/tsconfig.offline-test.json \
//     node --import tsx --test scripts/verify-offline-doctrine.mjs
// (or: `pnpm --filter docs test:offline`)

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url); // repo root
const MOB_OFFLINE = new URL("apps/mob/lib/offline/", ROOT);
const MOB_PROVIDERS = new URL("apps/mob/providers/", ROOT);
const MOB_AGENTS = new URL("apps/mob/AGENTS.md", ROOT);
const ADR_DIR = new URL("apps/docs/content/ADR/", ROOT);

const UUID_V4 = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;

// ── Contract surface the doctrine names (file -> required exports) ──
const CONTRACT = [
  { path: new URL("db.ts", MOB_OFFLINE), symbols: ["DB_NAME", "getLocalDb"] },
  {
    path: new URL("sync-queue.ts", MOB_OFFLINE),
    symbols: [
      "enqueueMutation",
      "listQueue",
      "setStatus",
      "markSynced",
      "markFailed",
      "dismissQueueItem",
      "upsertCache",
      "getCacheByType",
      "storeDownload",
      "setMeta",
      "getMeta",
      "SyncItemStatus",
      "SyncQueueRow",
    ],
  },
  { path: new URL("device-id.ts", MOB_OFFLINE), symbols: ["getDeviceId"] },
  { path: new URL("persist.ts", MOB_OFFLINE), symbols: ["getQueryPersister"] },
  { path: new URL("offline-provider.tsx", MOB_PROVIDERS), symbols: ["OfflineProvider", "useOffline"] },
  { path: new URL("use-offline-mutation.ts", MOB_OFFLINE), symbols: ["useOfflineMutation"] },
];

function assertExports(filePath, symbols) {
  const src = readFileSync(filePath, "utf8");
  for (const sym of symbols) {
    const re = new RegExp(`\\bexport\\b[\\s\\S]{0,400}?\\b${sym}\\b`);
    assert.ok(re.test(src), `${filePath} should export "${sym}"`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 1 — Doctrine & contract verification (no native execution)
// ─────────────────────────────────────────────────────────────────────────────
describe("Offline doctrine — doc & contract verification", () => {
  const agentsMd = readFileSync(fileURLToPath(MOB_AGENTS), "utf8");

  test("the Offline Subsystem Contract section is documented", () => {
    assert.ok(/Offline Subsystem Contract/.test(agentsMd), "AGENTS.md must document the offline contract");
  });

  test("every contracted file exists on disk", () => {
    for (const { path } of CONTRACT) {
      assert.ok(existsSync(fileURLToPath(path)), `missing contracted file: ${path}`);
    }
  });

  test("every contracted file exports its named symbols (no phantom imports)", () => {
    for (const { path, symbols } of CONTRACT) {
      assertExports(fileURLToPath(path), symbols);
    }
  });

  test("the idempotency-key invariant (deviceId:uuid, ADR-0036 d7) is in the source", () => {
    const src = readFileSync(fileURLToPath(new URL("sync-queue.ts", MOB_OFFLINE)), "utf8");
    assert.ok(
      /idempotencyKey\s*=\s*opts\.deviceId\s*\+\s*":".*uuidv4\(\)/.test(src),
      "enqueueMutation must compose idempotency_key = deviceId + ':' + uuid",
    );
  });

  test("ADR cross-links resolve to real docs", () => {
    const adrNames = readdirSync(fileURLToPath(ADR_DIR));
    const refs = [...new Set([...agentsMd.matchAll(/ADR-(\d{4})/g)].map((m) => m[1]))];
    assert.ok(refs.length > 0, "AGENTS.md should reference at least one ADR");
    for (const num of refs) {
      const found = adrNames.some((n) => n.startsWith(`${num}-`) && n.endsWith(".md"));
      assert.ok(found, `ADR-${num} cross-link must resolve (looked in ${ADR_DIR})`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PART 2 — Functional: real offline source, native deps mocked
// ─────────────────────────────────────────────────────────────────────────────
const fakeSqlite = await import("expo-sqlite");
const fakeSecure = await import("expo-secure-store");
const sq = await import(new URL("sync-queue.ts", MOB_OFFLINE).href);
const dev = await import(new URL("device-id.ts", MOB_OFFLINE).href);

describe("Offline subsystem — functional (real source, native deps mocked)", () => {
  beforeEach(async () => {
    fakeSqlite.__resetFakeDb();
    fakeSecure.__resetSecureStore();
  });

  test("idempotency key = deviceId:uuid (RFC-4122 v4) and is unique per item", () => {
    const k1 = sq.enqueueMutation({ type: "animal:register", payload: { id: "a1" }, deviceId: "pda_X" });
    assert.match(k1, new RegExp(`^pda_X:${UUID_V4.source}$`), "key must be deviceId:uuid");
    const k2 = sq.enqueueMutation({ type: "animal:register", payload: { id: "a2" }, deviceId: "pda_X" });
    assert.notEqual(k1, k2, "two enqueues must produce distinct idempotency keys");
  });

  test("outbox lifecycle: pending -> synced / failed / dismissed", () => {
    const k = sq.enqueueMutation({ type: "t", payload: { x: 1 }, deviceId: "d" });
    const rows = sq.listQueue();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "pending");
    assert.deepEqual(rows[0].payload, { x: 1 }, "payload round-trips through JSON");

    sq.markSynced(k);
    assert.equal(sq.listQueue()[0].status, "synced");

    const k2 = sq.enqueueMutation({ type: "t", payload: {}, deviceId: "d" });
    sq.markFailed(k2, "boom");
    const failed = sq.listQueue("failed");
    assert.equal(failed.length, 1);
    assert.equal(failed[0].status, "failed");
    assert.equal(failed[0].error_message, "boom");
    assert.equal(failed[0].attempts, 1, "markFailed increments attempts");

    sq.setStatus(k, "syncing");
    assert.equal(sq.listQueue()[0].status, "syncing");

    sq.dismissQueueItem(k2);
    assert.equal(sq.listQueue("failed").length, 0, "dismiss removes the local row only");
    assert.equal(sq.listQueue().length, 1, "the synced item survives dismissal");
  });

  test("storeDownload materializes the local cache and advances the watermark", () => {
    const res = {
      animals: [{ id: "a1", updatedAt: "2024-01-01T00:00:00.000Z" }],
      farms: [{ id: "f1", updatedAt: "2024-01-01T00:00:00.000Z" }],
      movements: [],
      inspections: [],
      earTags: [],
      diseases: [],
      vaccines: [],
      batches: [],
      vaccineDiseases: [],
      watermark: "2024-01-02T00:00:00.000Z",
    };
    sq.storeDownload(res);
    assert.equal(sq.getMeta("watermark"), "2024-01-02T00:00:00.000Z", "watermark advanced");
    assert.equal(sq.getCacheByType("animal").length, 1);
    assert.equal(sq.getCacheByType("animal")[0].id, "a1");

    // Re-download the same animal: upsert, not duplicate.
    sq.storeDownload({
      animals: [{ id: "a1", updatedAt: "2024-02-02T00:00:00.000Z" }],
      farms: [],
      movements: [],
      inspections: [],
      earTags: [],
      diseases: [],
      vaccines: [],
      batches: [],
      vaccineDiseases: [],
      watermark: "2024-02-02T00:00:00.000Z",
    });
    const animals = sq.getCacheByType("animal");
    assert.equal(animals.length, 1, "upsertCache overwrites on (type,id)");
    assert.equal(animals[0].updatedAt, "2024-02-02T00:00:00.000Z");
  });

  test("device identity is stable per install and persisted to secure store", async () => {
    const id1 = await dev.getDeviceId();
    assert.match(id1, new RegExp(`^pda_${UUID_V4.source}$`), "device id is pda_<uuid>");
    const id2 = await dev.getDeviceId();
    assert.equal(id1, id2, "getDeviceId is memoized (stable per install)");
    assert.equal(fakeSecure._store.get("rocky_device_id"), id1, "device id persisted to secure store");
  });

  test("query persister builds over the local DB", async () => {
    const { getQueryPersister } = await import(new URL("persist.ts", MOB_OFFLINE).href);
    const persister = getQueryPersister();
    assert.ok(persister, "getQueryPersister returns a persister");
    assert.equal(typeof persister.persistClient, "function");
    assert.equal(typeof persister.restoreClient, "function");
    assert.equal(typeof persister.removeClient, "function");
  });

  test("useOfflineMutation is wired to enqueue + online-gated flush (structural)", () => {
    const src = readFileSync(fileURLToPath(new URL("use-offline-mutation.ts", MOB_OFFLINE)), "utf8");
    assert.ok(/export function useOfflineMutation/.test(src), "useOfflineMutation is exported");
    assert.ok(/enqueueMutation/.test(src), "must enqueue into the outbox");
    assert.ok(/onlineManager\.isOnline\(\)/.test(src), "must gate flush on online state");
    assert.ok(/flush\(\)/.test(src), "must drain the outbox when online");
  });
});
