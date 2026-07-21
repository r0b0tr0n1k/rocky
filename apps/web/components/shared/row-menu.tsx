"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@rocky/ui/components/alert-dialog";
import { Button } from "@rocky/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rocky/ui/components/dropdown-menu";
import { cn } from "@rocky/ui/lib/utils";
import { AlertTriangleIcon, MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/**
 * Canonical row action menu. Sublates the two prior primitives —
 * `RowActions` (navigation links) and `RowActionMenu` (link/dialog/action) —
 * into one kebab that carries the full interaction grammar (M3/M4):
 *
 *   - `navigation` — push to an internal href (the old RowActions contract)
 *   - `action`      — run an onClick handler
 *   - `destructive` — confirm via AlertDialog, then run; a sonner Undo toast
 *                     is offered when `undo` is supplied (no bare destructive
 *                     mutation may fire from a menu)
 *   - `dialog`      — render a provided dialog node (ActionDialog / details)
 *
 * Ordering is caller-controlled; the convention is primary-first so the most
 * important action sits at the top of the kebab.
 */
/** Icon accepted by row-menu items. Permissive enough to accept lucide icons
 *  (which carry extra optional props) and the looser `IconComponent` shape
 *  used by the legacy RowActions / RowActionMenu APIs. */
type RowMenuIcon = React.ComponentType<{ className?: string; "data-icon"?: string }>;

export interface DestructiveRowMenuItem {
  kind: "destructive";
  label: string;
  icon?: RowMenuIcon;
  disabled?: boolean;
  /** Confirmation copy shown in the AlertDialog. */
  alert?: string;
  /** The irreversible mutation. Runs only after explicit confirmation. */
  onConfirm: () => void;
  /** Optional revert; surfaced as a sonner Undo toast after confirm. */
  undo?: () => void;
}

export type RowMenuItem =
  | { kind: "navigation"; label: string; href: string; icon?: RowMenuIcon }
  | {
      kind: "action";
      label: string;
      icon?: RowMenuIcon;
      disabled?: boolean;
      onClick: () => void;
    }
  | DestructiveRowMenuItem
  | { kind: "dialog"; dialog: React.ReactNode };

export interface RowMenuProps {
  items: RowMenuItem[];
  /** Accessible name for the kebab trigger. Prefer a real per-row label
   *  (e.g. `Manage ${row.original.earTagNumber}`) over the generic default. */
  label?: string;
  align?: "start" | "center" | "end";
  size?: "default" | "sm" | "icon" | "xs";
  className?: string;
  contentClassName?: string;
}

export function RowMenu({
  items,
  label = "Actions",
  align = "end",
  size = "icon",
  className,
  contentClassName,
}: RowMenuProps) {
  const router = useRouter();
  const [confirmItem, setConfirmItem] = React.useState<DestructiveRowMenuItem | null>(null);

  const handleConfirm = () => {
    if (!confirmItem) return;
    const item = confirmItem;
    item.onConfirm();
    if (item.undo) {
      toast(item.label, {
        action: {
          label: "Undo",
          onClick: () => item.undo?.(),
        },
      });
    }
    setConfirmItem(null);
  };

  const renderItem = (item: RowMenuItem, index: number) => {
    switch (item.kind) {
      case "navigation":
        return (
          <DropdownMenuItem key={`navigation-${index}`} onSelect={() => router.push(item.href)}>
            {item.icon ? <item.icon className="size-4" /> : null}
            <span>{item.label}</span>
          </DropdownMenuItem>
        );
      case "action":
        return (
          <DropdownMenuItem key={`action-${index}`} disabled={item.disabled} onSelect={() => item.onClick()}>
            {item.icon ? <item.icon className="size-4" /> : null}
            <span>{item.label}</span>
          </DropdownMenuItem>
        );
      case "destructive":
        return (
          <DropdownMenuItem
            key={`destructive-${index}`}
            variant="destructive"
            disabled={item.disabled}
            onSelect={() => setConfirmItem(item)}
            className="focus:!bg-[var(--error-soft)] focus:!text-[var(--error-deep)] active:!bg-[var(--error-deep)] active:!text-white"
          >
            {item.icon ? <item.icon className="size-4" /> : <AlertTriangleIcon className="size-4" />}
            <span>{item.label}</span>
          </DropdownMenuItem>
        );
      case "dialog":
        // Dialog items render their own trigger (ActionDialog / details).
        return <React.Fragment key={`dialog-${index}`}>{item.dialog}</React.Fragment>;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={cn("text-muted-foreground data-[state=open]:bg-muted", className)}
            aria-label={label}
            title={label}
          >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className={cn("w-48 row-menu-surface", contentClassName)}>
          {items.map(renderItem)}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!confirmItem}
        onOpenChange={(open) => {
          if (!open) setConfirmItem(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmItem?.label}</AlertDialogTitle>
            <AlertDialogDescription>{confirmItem?.alert ?? "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
