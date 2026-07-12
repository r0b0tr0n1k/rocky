// ── Shared Router Param Schemas - Diamond Seal ──
//
// These are the universal tRPC procedure params (id-keyed lookups, org-type
// lookups) that every router would otherwise hand-author inline via
// `import { z } from "zod"`. Per the Single Source of Truth, NO router may
// author Zod — every shape lives in api.ts. Routers import these pre-built
// schemas and bind them as .input()/.output().

import { z } from "zod";
import type { ActivateGuillotines, NoDrift } from "../utils/type-bridge.js";

export const idParamSchema = z.strictObject({ id: z.uuid() });
export type IdParam = z.infer<typeof idParamSchema>;

export const orgTypeParamSchema = z.strictObject({ orgType: z.string() });
export type OrgTypeParam = z.infer<typeof orgTypeParamSchema>;

type _drift_idParam = NoDrift<z.infer<typeof idParamSchema>, IdParam>;
type _drift_orgTypeParam = NoDrift<z.infer<typeof orgTypeParamSchema>, OrgTypeParam>;

export type _ParamsGuillotines = ActivateGuillotines<[_drift_idParam, _drift_orgTypeParam]>;


