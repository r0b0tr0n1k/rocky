"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rocky/ui/components/dropdown-menu";

export interface RowActionItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string; "data-icon"?: string }>;
}

/**
 * Per-row kebab menu (shadcn canonical data-table pattern).
 * Right-aligned; renders nothing when there are no actions.
 */
export function RowActions({ actions, label = "Actions" }: { actions: RowActionItem[]; label?: string }) {
  const router = useRouter();
  if (actions.length === 0) return null;
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={label}>
            <MoreHorizontalIcon data-icon="inline-start" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((a) => (
            <DropdownMenuItem key={a.label} onSelect={() => router.push(a.href)}>
              {a.icon ? <a.icon data-icon="inline-start" /> : null}
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
