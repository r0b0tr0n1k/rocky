"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rocky/ui/components/dialog";
import { DropdownMenuItem } from "@rocky/ui/components/dropdown-menu";
import { EyeIcon } from "lucide-react";
import type { ReactNode } from "react";
import * as React from "react";

export interface DetailField {
  label: string;
  value: ReactNode;
}

/**
 * Read-only master-data inspector. Renders a DropdownMenuItem trigger (so it
 * slots into a RowActionMenu) that opens a non-editable detail dialog.
 */
export function RowDetailsDialog({
  title,
  description,
  fields,
  triggerLabel = "View details",
  icon: Icon = EyeIcon,
}: {
  title: string;
  description?: string;
  fields: DetailField[];
  triggerLabel?: string;
  icon?: React.ComponentType<{ className?: string; "data-icon"?: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <DropdownMenuItem onSelect={() => setOpen(true)}>
        <Icon data-icon="inline-start" />
        {triggerLabel}
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            {fields.map((f) => (
              <React.Fragment key={f.label}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="min-w-0 break-words">{f.value ?? "—"}</dd>
              </React.Fragment>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
