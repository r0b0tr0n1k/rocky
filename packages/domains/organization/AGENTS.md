# Organization Domain Service

**Scope:** `packages/domains/organization/` — service, repository, errors
**Source spec:** SM.PDF §Organizations
**Last verified:** 2026-07-05

## Overview

Manages organizations (VD, VS, BIP, slaughterhouses, markets, farms). Supports hierarchical org tree (parent/children). Organizations are referenced by users, farms, ear tag orders, and other entities.

## Service Methods

**Row-shape types:** `OrganizationRow` is re-exported from this domain's repository so services import it relative (ROCKY-DS 001:2026(E) §8.2) instead of importing `@rocky/database` table definitions directly.

`packages/domains/organization/src/services/organization.service.ts`:

| Method             | Purpose                      | Status |
| ------------------ | ---------------------------- | ------ |
| `getById(id)`      | Fetch single organization    | ✅      |
| `list()`           | List all organizations       | ✅      |
| `listByType(type)` | Filter organizations by type | ✅      |
| `create(input)`    | Create a new organization    | ✅      |

## Relations

- Parent/child hierarchy via `organizations.parentId`
- Users assigned to organizations via `users.organizationId`
