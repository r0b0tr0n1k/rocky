"use client";

import type * as React from "react";

import { RowMenu, type RowMenuItem } from "#components/shared/row-menu";

export interface RowActionItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string; "data-icon"?: string }>;
}

/**
 * Per-row kebab menu of navigation links (shadcn canonical data-table
 * pattern). Thin adapter over `RowMenu` — every row kebab now flows through
 * the one canonical renderer. Right-aligned; renders nothing when empty.
 */
export function RowActions({ actions, label = "Actions" }: { actions: RowActionItem[]; label?: string }) {
  if (actions.length === 0) return null;
  const items: RowMenuItem[] = actions.map((a) => ({
    kind: "navigation",
    label: a.label,
    href: a.href,
    icon: a.icon,
  }));
  return (
    <div className="flex justify-end">
      <RowMenu items={items} label={label} align="end" />
    </div>
  );
}
