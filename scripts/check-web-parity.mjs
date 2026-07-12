#!/usr/bin/env node
// SPDX-License-Identifier: UNLICENSED
//
// check-web-parity.mjs — Web ↔ Backend contract-parity guardian (ADR-0050 / ADR-0055).
//
// Purpose: detect silent drift between the backend tRPC surface
// (`packages/trpc/src/generated/server.ts`) and what the web admin
// (`apps/web`) actually invokes. This is the enforceable form of the
// "list-only fetish" anti-pattern: a backend router added with no web
// affordance fails the build.
//
// Contract (ADR-0055 Verification): every backend router is invoked by the
// web (`sync` is exempt — it is a mobile-owned read-only monitor, not CRUD).
// Router-level coverage is the non-negotiable gate; procedure-level
// ("every Mutation has a form") is reported but only enforced under --strict
// (Phase 4 of ADR-0055 — not yet reachable, so it does not block CI today).
//
// Usage:
//   node scripts/check-web-parity.mjs            # router-coverage gate (CI)
//   node scripts/check-web-parity.mjs --strict   # also fail on unwired Mutations
//   ROUTER_EXEMPT=sync,geo node scripts/check-web-parity.mjs

import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const serverTs = path.join(repo, "packages/trpc/src/generated/server.ts");
const webDir = path.join(repo, "apps/web");
const strict = process.argv.includes("--strict");
const exempt = new Set((process.env.ROUTER_EXEMPT ?? "sync").split(",").map((s) => s.trim()).filter(Boolean));

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}
if (!fs.existsSync(serverTs)) fail(`generated server.ts not found at ${serverTs} — run \`pnpm generate:trpc\` first.`);

// --- Parse backend routers + procedures from the generated AppRouter ---
const lines = fs.readFileSync(serverTs, "utf8").split("\n");
const backend = new Map(); // router -> { procs: [{name, kind}] }
let cur = null,
  curProc = null,
  buf = [];
const flush = () => {
  if (cur && curProc) {
    const block = buf.join("\n");
    backend.get(cur).push({ name: curProc, kind: /\.mutation\(/.test(block) ? "mutation" : "query" });
  }
  buf = [];
  curProc = null;
};
for (const line of lines) {
  const r = line.match(/^  ([A-Za-z_]\w*):\s*t\.router\(/);
  if (r) { flush(); cur = r[1]; backend.set(cur, []); continue; }
  const p = line.match(/^    ([A-Za-z_]\w*):\s*publicProcedure/);
  if (p) { flush(); curProc = p[1]; buf = [line]; continue; }
  if (curProc) buf.push(line);
}
flush();

// --- Scan web for trpc.<router>.<proc> usage ---
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", ".turbo"].includes(e.name)) continue;
    const fp = path.join(d, e.name);
    if (e.isDirectory()) walk(fp);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(fp);
  }
}
walk(webDir);
const used = new Map();
const re = /trpc\.([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\.(queryOptions|mutationOptions|subscriptionOptions|getQueryKey|useQuery|useMutation|useInfiniteQuery|useSuspenseQuery)/g;
const re2 = /trpcClient\.([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/g;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  let c;
  while ((c = re.exec(src))) (used.get(c[1]) ?? used.set(c[1], new Set()).get(c[1])).add(c[2]);
  while ((c = re2.exec(src))) (used.get(c[1]) ?? used.set(c[1], new Set()).get(c[1])).add(c[2]);
}

// --- Build report ---
const rows = [];
let totalProcs = 0,
  totalInvoked = 0,
  totalMutations = 0,
  totalMutInvoked = 0,
  missingRouters = [];
for (const [router, procs] of backend) {
  totalProcs += procs.length;
  const invoked = used.get(router) ?? new Set();
  const m = procs.filter((p) => p.kind === "mutation");
  const mInvoked = m.filter((p) => invoked.has(p.name));
  totalMutations += m.length;
  totalMutInvoked += mInvoked.length;
  totalInvoked += procs.filter((p) => invoked.has(p.name)).length;
  const invokedCount = procs.filter((p) => invoked.has(p.name)).length;
  if (invokedCount === 0 && !exempt.has(router)) missingRouters.push(router);
  rows.push({ router, procs: procs.length, invoked: invokedCount, mutations: m.length, mutInvoked: mInvoked.length, exempt: exempt.has(router) });
}
rows.sort((a, b) => a.router.localeCompare(b.router));

const invokedRouters = [...backend.keys()].filter((r) => (used.get(r)?.size ?? 0) > 0 || exempt.has(r)).length;

console.log("Web ↔ Backend parity (ADR-0050 / ADR-0055)");
console.log("─".repeat(64));
console.log(
  `${"router".padEnd(16)} ${"procs".padStart(6)} ${"invoked".padStart(8)} ${"mut".padStart(5)} ${"mut✓".padStart(6)}`
);
for (const r of rows) {
  console.log(
    `${r.router.padEnd(16)} ${String(r.procs).padStart(6)} ${String(r.invoked).padStart(8)} ${String(r.mutations).padStart(5)} ${String(r.mutInvoked).padStart(6)}${r.exempt ? "  (exempt)" : ""}`
  );
}
console.log("─".repeat(64));
console.log(
  `backend routers : ${backend.size}\n` +
    `web-invoked     : ${invokedRouters} (exempt: ${[...exempt].join(", ") || "none"})\n` +
    `procedures      : ${totalInvoked}/${totalProcs} invoked (${Math.round((totalInvoked / totalProcs) * 100)}%)\n` +
    `mutations       : ${totalMutInvoked}/${totalMutations} wired`
);

// --- Gate ---
if (missingRouters.length) {
  fail(`Backend routers with NO web invocation: ${missingRouters.join(", ")}. Add a web affordance or list it in ROUTER_EXEMPT.`);
}
if (strict) {
  const unwired = [];
  for (const [router, procs] of backend) {
    if (exempt.has(router)) continue;
    for (const p of procs) if (p.kind === "mutation" && !(used.get(router)?.has(p.name))) unwired.push(`${router}.${p.name}`);
  }
  if (unwired.length) fail(`Unwired Mutations (--strict): ${unwired.length} — ${unwired.slice(0, 20).join(", ")}${unwired.length > 20 ? " …" : ""}`);
}

console.log("\n✓ web-parity gate passed (every backend router is invoked by the web).");
process.exit(0);
