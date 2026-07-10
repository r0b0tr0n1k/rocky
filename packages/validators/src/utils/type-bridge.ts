// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINE SYSTEM - the Materialist Enforcement of the Symbolic Order
// ═══════════════════════════════════════════════════════════════════════════
//
// The Diamond Seal uses a three-tier enforcement hierarchy:
//
//   Tier 1 - `satisfies z.ZodType<Interface>` on the schema declaration
//     Checks the schema's _output type is assignable to the interface.
//     Catches: missing fields, wrong value types.
//     Does NOT catch: interface having wider types than schema output.
//     Use on: ALL schemas (response AND request).
//
//   Tier 2 - `NoDrift<z.infer<typeof schema>, Interface>` on a separate type alias
//     Full structural identity check via AssertEqual (higher-kinded type equality).
//     Catches: interface wider OR narrower than schema output.
//     May false-positive on complex union types crossing drizzle-zod boundaries.
//     Use on: response schemas, hand-built request schemas (no drizzle Dumb Zod).
//
//   Tier 3 - `ActivateGuillotines<[_drift_A, _drift_B, ...]>` at file end
//     Forces TypeScript to EVALUATE every type alias in the tuple.
//     Without this, lazy type resolution may never check NoDrift until
//     something else references it. This makes the type alias DO WORK.
//
// Escalation path when NoDrift false-positives:
//   1. Try swapping to NoDriftSimple (bidirectional extends, not AssertEqual)
//   2. The _drift_* = true bypass is the last resort - removes coverage
//
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type AssertEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false;

export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;

/**
 * **NoDrift** - Full structural identity via higher-kinded type equality.
 *
 * Uses the `AssertEqual` trick (two Ts are equal iff their generic
 * function signatures are identical). This is stricter than `extends`
 * in both directions and catches subtle differences like `readonly`,
 * branded types, and optional vs `| undefined` markers.
 *
 * FALSE-POSITIVE RISK: complex union types (e.g. z.enum union vs
 * identical interface union) can cause AssertEqual to fail even when
 * the types are structurally identical. Switch to NoDriftSimple in
 * that case.
 *
 * USAGE:
 *   type _drift_MyEntity = NoDrift<z.infer<typeof mySchema>, MyEntity>;
 *
 * ON DRIFT:
 *   Resolves to: ["TYPE DRIFT DETECTED ──", { expected: A; actual: B }]
 *   ActivateGuillotines fails because the tuple does not extend `true[]`.
 */
export type NoDrift<A, B> =
  AssertEqual<A, B> extends true ? true : ["TYPE DRIFT DETECTED ──", { expected: A; actual: B }];

/**
 * **NoDriftSimple** - Bidirectional structural assignability.
 *
 * Checks `A extends B` AND `B extends A`. Less precise than AssertEqual
 * (does not catch readonly or branded-type differences) but immune to
 * false positives on union type aliases that AssertEqual triggers.
 *
 * USAGE (same as NoDrift):
 *   type _drift_MyEntity = NoDriftSimple<z.infer<typeof mySchema>, MyEntity>;
 *
 * DRIFT MESSAGES:
 *   "DRIFT (A narrower)"  → Schema output is narrower than interface:
 *                             some field exists in schema but not interface.
 *   "DRIFT (B narrower)"  → Interface is narrower than schema output:
 *                             interface has optional where schema has required,
 *                             or interface omits a field entirely.
 */
export type NoDriftSimple<A, B> = A extends B
  ? B extends A
  ? true
  : ["DRIFT (B narrower)", A, B]
  : ["DRIFT (A narrower)", A, B];

/**
 * **ActivateGuillotines** - Forces compile-time evaluation of NoDrift types.
 *
 * TypeScript's type system is lazy - unreferenced type aliases are never
 * evaluated. `ActivateGuillotines` consumes every alias in the tuple and
 * constrains them to a NON-EMPTY `true[]` (`[true, ...true[]]`). If ANY
 * alias resolved to a drift tuple instead of `true`, the constraint fails
 * and the compiler errors. The non-empty constraint also rejects
 * `ActivateGuillotines<[]>` so a file with ZERO proofs cannot build green.
 *
 * USAGE (at end of every *.api.ts file):
 *
 *   export type _MyGuillotines = ActivateGuillotines<
 *     [_drift_response, _drift_summary, _drift_listResponse, _drift_create]
 *   >;
 *
 * DEBUGGING:
 *   Remove ActivateGuillotines and check the type of each _drift_*
 *   alias individually. A drift tuple shows the exact mismatch.
 */
/**
 * Non-empty variant: requires at least ONE guillotine proof.
 * `ActivateGuillotines<[]>` (empty tuple) is REJECTED — a file with
 * zero proofs must not compile green. This closes the empty-tuple
 * footgun: every *.api.ts / *.events.ts file must declare ≥1 _drift_* alias.
 */
export type ActivateGuillotines<T extends [true, ...true[]]> = T;

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-LAYER BRIDGE PRIMITIVES (adopted from the Guillotine reference)
//
// The core tiers (satisfies / NoDrift / ActivateGuillotines) already exist.
// These three prove the Directional / Result-aware relationships the core
// tiers do NOT: DB→API field coverage (Bridge 1), service-return↔schema
// (Bridge 2b via OkType), and L4 consumer↔validator coverage (Bridge 3).
// All are pure types — they evaporate at compile time, 0 runtime bytes.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * **OkType / ErrType / InferOk** — extract the branches of a neverthrow
 * `Result<T, E>` at the type level (Bridge 2b).

 * Routers call `result.unwrap()`, returning the success `T`. To prove that
 * `T` matches a schema's output, extract it here WITHOUT importing
 * neverthrow into the validators package:
 *
 *   NoDrift<OkType<ReturnType<WalletService["getWallet"]>>,
 *           z.output<typeof getWalletOutputSchema>>
 *
 * Resolves to `never` if the value is not a `Result` — itself a compile
 * error inside a guillotine.
 */
export type OkType<T> = T extends Promise<infer P>
  ? OkType<P>
  : Extract<T, { isOk: true }> extends { value: infer V }
    ? V
    : never;
export type ErrType<T> = T extends Promise<infer P>
  ? ErrType<P>
  : Extract<T, { isErr: true }> extends { error: infer E }
    ? E
    : never;
export type InferOk<T> = OkType<T>;

/**
 * **SubtypeGuillotine** — Directional coverage proof (Bridge 3).
 *
 * Proves `A` is assignable to `B` (A extends B): the validator schema
 * output must COVER the domain consumer's expected interface. Lives in the
 * CONSUMER layer (L4 domain service), never in validators — the Diamond
 * Seal forbids L1←L4 imports, so the domain holds the axe:
 *
 *   type _bridge = SubtypeGuillotine<
 *     z.output<typeof telegramMessageSchema>, TelegramMessageHandlerInput
 *   >;
 */
export type SubtypeGuillotine<A, B> =
  A extends B ? true : ["SCHEMA DOES NOT COVER DOMAIN ──", { schema: A; expected: B }];

/**
 * **AssertFieldCoverage** — DB→API drift detection (Bridge 1).
 *
 * Proves the API schema's OUTPUT is assignable to the Drizzle-Zod DB
 * SELECT schema's OUTPUT (minus explicitly omitted fields like tenantId).
 * If the DB adds a required column the API output silently drops, this
 * severs the build — catching drift between generated Dumb Zod and the
 * hand-sculpted API schema:
 *
 *   type _bridge = AssertFieldCoverage<
 *     z.output<typeof dispatchPaginationSchema>,
 *     z.output<typeof dispatchSelectSchema.omit({ tenantId: true })>
 *   >;
 */
export type AssertFieldCoverage<Api, Db> =
  Api extends Db ? true : ["API DROPPED DB FIELD ──", { db: Db; api: Api }];
