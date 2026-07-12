"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { SearchIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";

/**
 * Contained data surface — the enterprise "control panel vs data payload"
 * boundary. A Card with an optional toolbar (left cluster + top-right action)
 * wrapping the table body. Used everywhere a list table appears so the eye
 * reads: command area (outside) → data payload (inside).
 */
export function TableCard({
  toolbarLeft,
  action,
  children,
  className,
}: {
  toolbarLeft?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasToolbar = toolbarLeft != null || action != null;
  return (
    <Card className={className}>
      {hasToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbarLeft}</div>
          {action}
        </div>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Leading-icon search box for table toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

/** Append a right-pinned row-action (kebab) column to a column set. */
export function appendRowActions<T>(
  columns: ColumnDef<T>[],
  rowActions: (row: T) => ReactNode,
): ColumnDef<T>[] {
  return [
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { width: 64, align: "right" } as ColumnDef<T>["meta"],
      cell: ({ row }) => rowActions(row.original),
    },
  ];
}

/** Shared row-density class for contained tables (taller, less cramped). */
export const tableDensityClass = "[&_td]:!py-3 [&_th]:!py-3";
