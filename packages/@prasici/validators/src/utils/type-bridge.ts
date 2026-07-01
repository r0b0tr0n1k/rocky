// ── Type Bridge — NoDrift, AssertEqual, ExpectTrue ──
// Diamond Seal pattern: proves Zod schema matches TypeScript interface at compile time

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type AssertEqual<T, U> =
	(<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
		? true
		: false;

export type ExpectTrue<T extends true> = T;
export type ExpectFalse<T extends false> = T;

/**
 * NoDrift — proves z.infer<ZodSchema> matches TypeScript Interface.
 *
 * Usage:
 *   type _drift_MyEntity = NoDrift<z.infer<typeof mySchema>, MyEntity>;
 *
 * On drift, the type resolves to an error tuple with both types embedded.
 */
export type NoDrift<A, B> =
	AssertEqual<A, B> extends true
		? true
		: ["TYPE DRIFT DETECTED ──", { expected: A; actual: B }];

/**
 * ActivateGuillotines — forces compile-time evaluation of NoDrift types.
 *
 * Usage:
 *   export type _Activate = ActivateGuillotines<[_drift_A, _drift_B]>;
 */
export type ActivateGuillotines<T extends true[]> = T;
