# PDF / Document Generation — PDF Bot

**Scope:** `packages/pdf/` — document generation framework; PDF/A-3 hybrid output (Typst render + @e-invoice-eu embed) + PAdES signing (HSM) + QR (ear tags)
**Status:** Phase 1 complete — YAML/XML intermediate for 3 document types. PDF/A rendering **activated** by **ADR-0082** (Typst + @e-invoice-eu library + PAdES via HSM).

## Overview

The `@rocky/pdf` package provides a **pluggable document generation framework**. Documents flow through a pipeline:

```
Template.fetchData(refId) → Template.mapToModel(data) → YamlSerializer.serialize(model) → YAML string
```

PDF rendering is intentionally deferred — YAML/XML intermediate files are the stable API. A future PDF/A engine will consume these intermediates.

## Architecture

```
DocumentRouter (tRPC)
  → DocumentService.generate()
    → DocumentRegistry.get(type) → DocumentTemplate
      → fetchData(refId) — domain data fetch
      → mapToModel(data) — pure mapping to YAML model
    → serializeToYaml(model) → YAML string
  → DocumentResponse { content, documentType, modelVersion, ... }
```

### Key Components

| File | Purpose |
|------|---------|
| `src/engine/document-template.ts` | `DocumentTemplate` interface + `BaseDocumentTemplate` abstract class |
| `src/engine/document-registry.ts` | Singleton `DocumentRegistry` — maps type string → template |
| `src/engine/yaml-serializer.ts` | `serializeToYaml(model)` using `js-yaml` |
| `src/templates/inspection-form.template.ts` | Inspection form (delegates to InspectionService.generateInspectionForm) |
| `src/templates/passport.template.ts` | Cattle passport (fetches passport + animal + parents + farm + movements + vaccinations) |
| `src/templates/movement.template.ts` | Movement/transport declaration (fetches movement + animal + farms) |
| `src/services/document.service.ts` | `DocumentService` — orchestrates registry + template + serializer |
| `src/errors/document.errors.ts` | 5 error codes + `documentErr()` factory |
| `src/pdf.module.ts` | `PdfModule` — NestJS DI module |

## Interface

```typescript
interface DocumentTemplate<TData, TModel> {
  readonly type: string;        // e.g. 'passport'
  readonly modelPath: string;   // e.g. 'models/passport.yaml'
  readonly name: string;        // e.g. 'Cattle Passport'
  readonly modelVersion: string;
  readonly availableFormats: DocumentFormat[];

  fetchData(refId: string): Promise<Result<TData, DocumentError>>;
  mapToModel(data: TData): TModel | Promise<TModel>;
}
```

## Adding a New Document Type

1. Create `src/templates/foo.template.ts` extending `BaseDocumentTemplate<TData, TModel>`
2. Implement `type`, `modelPath`, `name`, `modelVersion`, `fetchData`, `mapToModel`
3. Register in `apps/api/src/app.module.ts` via `DocumentRegistryProvider.onModuleInit()`
4. No router changes needed — `document.generate({ type: "foo", ... })` works automatically

**Template design rules:**

- Plain classes, no `@Injectable()` or `@Inject()` — instantiated via `useFactory` in AppModule
- Constructor receives domain repositories/services it needs
- `mapToModel` may be async (returns `Promise<TModel>`)
- `fetchData` returns `Result<TData, DocumentError>` — use `err()` for missing data, never throw
- `mapToModel` throws on domain errors (they bubble through DocumentService)

## NestJS Wiring (app.module.ts)

```typescript
DocumentRegistryProvider — implements OnModuleInit, registers all templates
PdfModule — provides DocumentService
Templates — provided via useFactory with injected repos/services:
  InspectionFormTemplate ← InspectionService
  PassportTemplate ← PassportRepository, AnimalRepository, FarmRepository, MovementRepository, HealthRepository
  MovementTemplate ← MovementRepository, AnimalRepository, FarmRepository
```

## Error Codes

| Code | When |
|------|------|
| `TEMPLATE_NOT_FOUND` | No template registered for the requested type |
| `UNSUPPORTED_FORMAT` | Requested format not in template.availableFormats |
| `FETCH_FAILED` | Template's fetchData() failed (entity not found, etc.) |
| `VALIDATION_FAILED` | Model output doesn't match YAML schema (future) |
| `SERIALIZATION_FAILED` | YAML serialization failed |

## Dependencies

- `@rocky/domains-inspection` — InspectionService for form data
- `@rocky/domains-passport` — PassportRepository
- `@rocky/domains-animal` — AnimalRepository
- `@rocky/domains-movement` — MovementRepository
- `@rocky/domains-farm` — FarmRepository
- `@rocky/domains-health` — HealthRepository (vaccination history for passports)
- `@rocky/database` — Drizzle types
- `js-yaml` — YAML serialization

## Remaining Work

1. **PDF/A rendering engine** — DECIDED (ADR-0082): render with **Typst** (`typst-business-templates`, JSON→PDF, in-process via WASM/NAPI) and wrap with the **`@e-invoice-eu` library** (PDF/A-3 hybrid embed); PAdES-sign (HSM). Replaces the old `js-yaml`-only output for `format: "pdf"`.
2. **PDF templates** — visual layout for each document type (inspection form, passport, movement declaration)
3. **XML output format** — extend `YamlSerializer` to support XML alongside YAML
4. **Model validation** — validate `mapToModel()` output against the YAML model schema before serialization
5. **Additional document types** — birth certificate, death certificate, import/export certificate

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **PDF Bot** | `packages/pdf/` | Engine, templates, module |
| **Inspection Bot** | Provides `InspectionService` to InspectionFormTemplate | |
| **Passport Bot** | Provides repos to PassportTemplate | |
| **Movement Bot** | Provides repos to MovementTemplate | |
| **Validation Bot** | `packages/validators/src/api/document.api.ts` | Request/response schemas |
| **API Bot** | `apps/api/src/routers/document.router.ts` | tRPC router, AppModule wiring |
