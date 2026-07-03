// ── Base Repository ──
// Simple DB reference holder. All domain repositories extend this.
// Shovels, not announcers — repositories return data, never publish events.

import type { DB } from "@rocky/database";

export class BaseRepository {
  constructor(protected readonly db: DB) {}
}
