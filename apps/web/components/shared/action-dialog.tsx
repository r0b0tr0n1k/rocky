"use client";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Button } from "@rocky/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rocky/ui/components/dialog";
import { DropdownMenuItem } from "@rocky/ui/components/dropdown-menu";
import type { ComponentType, ReactNode } from "react";
import * as React from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { type RowMenuItem as CanonicalRowMenuItem, RowMenu } from "#components/shared/row-menu";
import { ValidatedForm } from "#components/shared/validated-form";
import { useValidatedForm } from "#lib/use-validated-form";

type IconComponent = ComponentType<{ className?: string; "data-icon"?: string }>;

export interface ActionDialogProps<TInput extends FieldValues> {
  as?: "button" | "menuitem";
  triggerLabel: string;
  icon?: IconComponent;
  schema: z.ZodType<unknown, TInput>;
  /** A useMutation result (or the { mutate, isPending } slice). */
  mutation: { mutate: (values: TInput) => void; isPending: boolean };
  title: string;
  description?: string;
  /** Destructive confirmation copy shown in an Alert above the form. */
  alert?: string;
  alertVariant?: "default" | "destructive";
  defaultValues?: DefaultValues<TInput>;
  fields: (form: UseFormReturn<TInput>) => ReactNode;
  submitText?: string;
  /** Optional error summary rendered above the form (e.g. a failed mutation). */
  error?: ReactNode;
}

/**
 * Universal domain-action overlay. Sublates the many mutations of the
 * action-hub routes (Seize, Reprint, Complete, Resolve, Escalate, …) into
 * one Dialog + ValidatedForm. Renders a Button trigger or a DropdownMenuItem
 * trigger (when used inside a RowActionMenu kebab).
 */
export function ActionDialog<TInput extends FieldValues>({
  as = "button",
  triggerLabel,
  icon: Icon,
  schema,
  mutation,
  title,
  description,
  alert,
  alertVariant = "destructive",
  defaultValues,
  fields,
  submitText,
  error,
}: ActionDialogProps<TInput>) {
  const [open, setOpen] = React.useState(false);
  const form = useValidatedForm(schema as unknown as z.ZodType<unknown, TInput>, { defaultValues });

  // M4 · shadcn Form: focus the first field when the overlay opens.
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const root = contentRef.current;
      const focusable = root?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [role=combobox], [contenteditable=true]",
      );
      focusable?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const content = (
    <DialogContent ref={contentRef} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {alert ? (
        <Alert variant={alertVariant}>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <ValidatedForm
        form={form}
        submitting={mutation.isPending}
        onValid={(values) => mutation.mutate(values)}
        submitText={submitText ?? triggerLabel}
      >
        {fields(form)}
      </ValidatedForm>
    </DialogContent>
  );

  if (as === "menuitem") {
    return (
      <>
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          {Icon ? <Icon data-icon="inline-start" /> : null}
          {triggerLabel}
        </DropdownMenuItem>
        <Dialog open={open} onOpenChange={setOpen}>
          {content}
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        {Icon ? <Icon data-icon="inline-start" /> : null}
        {triggerLabel}
      </Button>
      {content}
    </Dialog>
  );
}

export type RowMenuItem =
  | { type: "link"; label: string; icon?: IconComponent; href: string }
  | { type: "dialog"; dialog: ReactNode }
  | { type: "action"; label: string; icon?: IconComponent; onClick: () => void };

/** Kebab menu that hosts link actions and ActionDialog triggers.
 *  Thin adapter over `RowMenu` — every row kebab now flows through the one
 *  canonical renderer. */
export function RowActionMenu({ items, label = "Actions" }: { items: RowMenuItem[]; label?: string }) {
  if (items.length === 0) return null;
  const menuItems: CanonicalRowMenuItem[] = items.map((item) => {
    switch (item.type) {
      case "link":
        return { kind: "navigation", label: item.label, href: item.href, icon: item.icon };
      case "dialog":
        return { kind: "dialog", dialog: item.dialog };
      case "action":
        return { kind: "action", label: item.label, icon: item.icon, onClick: item.onClick };
      default:
        throw new Error(`Unhandled RowActionMenu item type: ${(item as { type: string }).type}`);
    }
  });
  return (
    <div className="flex justify-end">
      <RowMenu items={menuItems} label={label} align="end" />
    </div>
  );
}
