# Todo Domain Service (Demo)

**Scope:** `packages/domains/todo/` — service, errors, types
**Source spec:** N/A — demo domain for CRUD prototyping
**Last verified:** 2026-07-05

## Overview

Demo CRUD domain used for testing the tRPC + NestJS stack. Demonstrates the full pattern: Zod validation → tRPC router → Domain service → DatabaseProvider → Drizzle ORM. **Not a production domain.**

## Service Methods

`packages/domains/todo/src/services/todo.service.ts`:

| Method | Purpose | Status |
|--------|---------|--------|
| `list(userId, completed?)` | List todos for a user, optional completed filter | ✅ |
| `create(input)` | Create a new todo | ✅ |
| `update(id, input)` | Update todo title/completed status | ✅ |
| `delete(id)` | Delete a todo | ✅ |

## Pattern Reference

This domain demonstrates the standard service pattern:
```typescript
async list(userId: string, completed?: boolean): Promise<Result<Todo[], Error>> {
  return fromAsyncThrowable(async () => {
    return this.repo.list(userId, completed);
  }, toAppError)();
}
```
