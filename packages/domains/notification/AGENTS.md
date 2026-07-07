# Notification Domain Service

**Scope:** `packages/domains/notification/` — service, repository, errors, types
**Source spec:** `docs/NOTIFICATION_SYSTEM.md`, `docs/NOTIFICATION_BG_SERVICE.md`
**Last verified:** 2026-07-07

## Overview

Manages in-app notifications for users. Supports unread counts, send/mark-as-read workflows, and cross-domain integration (e.g., birth notifications trigger from Animal domain).

## Service Methods

`packages/domains/notification/src/services/notification.service.ts`:

| Method                               | Purpose                               | Status |
| ------------------------------------ | ------------------------------------- | ------ |
| `getUnreadCount(userId)`             | Count unread notifications via SQL COUNT | ✅ |
| `create(input)`                      | Create a single notification          | ✅      |
| `createBatch(input)`                 | Create batch notifications            | ✅      |
| `send(input)`                        | Send notification (template + prefs)  | ✅      |
| `list(input)`                        | List user's notifications             | ✅      |
| `markAsRead(input)`                  | Mark notification as read             | ✅      |
| `getPending(limit)`                  | Get pending notifications (worker)    | ✅      |
| `updateDeliveryStatus(id, status)`   | Update delivery status after attempt  | ✅      |
| `getTemplate(code)`                  | Get notification template by code     | ✅      |

## Repository Methods

`packages/domains/notification/src/repositories/notification.repository.ts`:

| Method                               | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `insert(values)`                     | Insert a single notification          |
| `insertMany(rows)`                   | Insert multiple notifications         |
| `findPreferences(userId, category)`  | Find user preferences for a category  |
| `listFiltered(filters)`              | List with filters, pagination, order  |
| `countByUserAndStatus(userId, status)` | Count by userId and status (SQL COUNT) |
| `updateById(id, userId, data)`       | Update a notification                 |
| `updateByIdSystem(id, data)`         | Update any notification (system)      |
| `findPending(limit)`                 | Get pending notifications             |
| `incrementAttempts(id, updates)`     | Increment attempt counter atomically  |
| `findTemplateByCode(code)`           | Find template by code                 |

## Cross-Domain Integration

| Domain | Integration                                              |
| ------ | -------------------------------------------------------- |
| Animal | Birth notifications trigger `NotificationService.send()` |
