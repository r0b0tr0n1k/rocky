# Biome `recommended` Deprecation Fix

**Affected file:** `biome.json` (only file in repo)

## Problem
`biome.json` contains deprecated `linter.rules.recommended: true`. Biome 2.5.1 emits:
> The use of the recommended field has been deprecated, and will removed in the next major version of Biome. Use preset instead.

## Decision
Replace the deprecated field with the new `linter.preset` key.

## Change
In `biome.json`:

```diff
  "linter": {
    "enabled": true,
    "domains": {
      "react": "recommended",
      "test": "recommended",
      "project": "recommended"
    },
    "rules": {
      "a11y": "off",
-     "recommended": true,
      "style": {
        "noNonNullAssertion": "info"
      },
      "suspicious": {
        "noExplicitAny": "info"
      },
      "correctness": {
        "useImportExtensions": {
          "level": "on",
          "options": {
            "forceJsExtensions": true
          }
        }
      }
    },
+   "preset": "recommended",
  },
```

## Why this works
- `linter.preset` accepts `"recommended" | "all" | "none"`. Omitting it defaults to `"recommended"`; setting it explicitly documents intent and satisfies the deprecation warning.
- The custom nested rules under `style`, `suspicious`, and `correctness`, plus the top-level `a11y: "off"` override, continue to layer on top of the preset unchanged.
- `linter.domains` values (`"recommended"`) are unaffected — they are domain-level presets, not the deprecated linter-rules field.

## Validation
Run `npx biome check` on `biome.json` itself and on a representative source file (e.g., `apps/api/src/trpc/middlewares/execution.middleware.ts`) to confirm:
1. The deprecation warning is gone.
2. The previously customized rules still apply (`style/noNonNullAssertion`, `suspicious/noExplicitAny`, `correctness/useImportExtensions`, `a11y` off).

## Notes
- No other `biome.json` files exist in the repo.
- Schema version was already bumped to `2.5.1` in the prior session.
