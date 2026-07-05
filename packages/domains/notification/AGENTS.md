# Notification Domain Service

**Scope:** `packages/domains/notification/` — service, repository, errors, types
**Source spec:** `docs/NOTIFICATION_SYSTEM.md`, `docs/NOTIFICATION_BG_SERVICE.md`
**Last verified:** 2026-07-05

## Overview

Manages in-app notifications for users. Supports unread counts, send/mark-as-read workflows, and cross-domain integration (e.g., birth notifications trigger from Animal domain).

## Service Methods

`packages/domains/notification/src/services/notification.service.ts`:

| Method                               | Purpose                               | Status |
| ------------------------------------ | ------------------------------------- | ------ |
| `getUnreadCount(userId)`             | Count unread notifications for a user | ✅      |
| `send(userId, type, payload)`        | Send a notification to a user         | ✅      |
| `markAsRead(userId, notificationId)` | Mark a single notification as read    | ✅      |

## Cross-Domain Integration

| Domain | Integration                                              |
| ------ | -------------------------------------------------------- |
| Animal | Birth notifications trigger `NotificationService.send()` |
