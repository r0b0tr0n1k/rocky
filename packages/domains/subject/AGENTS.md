# Subject Domain Service

**Scope:** `packages/domains/subject/` — service, repository, errors
**Source spec:** SM.PDF §Subjects
**Last verified:** 2026-07-05

## Overview

Manages subjects (persons/keepers) in the I&R system. Subjects are distinct from users — a subject is a physical person (keeper, veterinarian, technician) while a user is a system account. Subjects are bound to farms via `farm_subjects`.

## Service Methods

`packages/domains/subject/src/services/subject.service.ts`:

| Method | Purpose | Status |
|--------|---------|--------|
| `getById(id)` | Fetch single subject | ✅ |
| `search(query)` | Search subjects by name/ID | ✅ |
| `create(input)` | Create a new subject (with personalId dedup check) | ✅ |
| `update(id, input)` | Update subject info, triggers farm book reprint per binding | ✅ |
| `bindToFarm(subjectId, farmId, role)` | Bind a subject to a farm with a role | ✅ |
| `unbindFromFarm(subjectId, farmId)` | Remove a subject from a farm | ✅ |

## Cross-Domain Integration

| Domain | Integration |
|--------|------------|
| Farm | `bindToFarm`/ `unbindFromFarm` reference `FarmRepository` |
| Farm Book | `SubjectService.update()` fires `FarmBookService.create()` per farm binding on keeper info change (Instance 3 Rule 4) |
| Animal | Subject may be referenced as animal keeper |
