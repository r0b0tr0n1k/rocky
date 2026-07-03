// ── Notification Domain Types ──
// Schemas are now in @rocky/validators/api/notifications.api.ts
// Only the raw DB row type lives here.

import type { notificationSelectSchema } from "@rocky/database/zod/sm";
import type { z } from "zod";

export type Notification = z.infer<typeof notificationSelectSchema>;
