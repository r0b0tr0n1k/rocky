# Fix `@rocky/ui` Turbopack ESM module resolution

## Problem

Next.js Turbopack fails to build `@rocky/admin` and `@rocky/docs` with errors like:

```
Module not found: Can't resolve '../lib/utils.js'
```

Root cause: `packages/ui/package.json` declares `"type": "module"`, so Node.js ESM resolution requires explicit extensions on relative imports. Internal imports in `packages/ui/src/components/*` omit extensions, causing Turbopack to resolve `.js` (which does not exist; the files are `.ts`/`.tsx`).

## Fix

Add explicit `.ts`/`.tsx` extensions to all relative imports inside `packages/ui/src/components/`.

### Files to modify

| File | Change |
|------|--------|
| `packages/ui/src/components/index.ts` | `../lib/utils` → `../lib/utils.ts`; `./button` → `./button.tsx`; `./badge` → `./badge.tsx`; `./label` → `./label.tsx`; `./sonner` → `./sonner.tsx`; `./form` → `./form.ts`; `./ds` → `./ds.tsx` |
| `packages/ui/src/components/badge.tsx` | `../lib/utils` → `../lib/utils.ts` |
| `packages/ui/src/components/button.tsx` | `../lib/utils` → `../lib/utils.ts` |
| `packages/ui/src/components/label.tsx` | `../lib/utils` → `../lib/utils.ts` |
| `packages/ui/src/components/form.tsx` | `../lib/utils` → `../lib/utils.ts`; `./label` → `./label.tsx` |
| `packages/ui/src/components/ds.tsx` | `../lib/utils` → `../lib/utils.ts` |

`sonner.tsx` has no internal relative imports; no change needed.

## Validation

After edits, run:

```bash
pnpm build
```

Both `@rocky/admin` and `@rocky/docs` should complete the Next.js build without `Module not found` errors.

## Out of scope

- `baseline-browser-mapping` stale-data warnings — informational only, does not break builds.
- Turbopack multiple-lockfiles warning — can be silenced by setting `turbopack.root` in `next.config.ts` for both apps, but is not blocking.
