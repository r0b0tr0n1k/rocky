"use client";

import * as React from "react";
import type { ComponentType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rocky/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rocky/ui/components/dropdown-menu";
import { Button } from "@rocky/ui/components/button";
import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";

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
}: ActionDialogProps<TInput>) {
  const [open, setOpen] = React.useState(false);
  const form = useValidatedForm(schema as unknown as z.ZodType<unknown, TInput>, { defaultValues });

  const content = (
    <DialogContent className="flex flex-col gap-4">
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

/** Kebab menu that hosts link actions and ActionDialog triggers. */
export function RowActionMenu({ items, label = "Actions" }: { items: RowMenuItem[]; label?: string }) {
  const router = useRouter();
  if (items.length === 0) return null;
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={label}>
            <MoreHorizontalIcon data-icon="inline-start" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item, i) =>
            item.type === "link" ? (
              <DropdownMenuItem key={item.label} onSelect={() => router.push(item.href)}>
                {item.icon ? <item.icon data-icon="inline-start" /> : null}
                {item.label}
              </DropdownMenuItem>
            ) : item.type === "action" ? (
              <DropdownMenuItem key={item.label} onSelect={item.onClick}>
                {item.icon ? <item.icon data-icon="inline-start" /> : null}
                {item.label}
              </DropdownMenuItem>
            ) : (
              <React.Fragment key={i}>{item.dialog}</React.Fragment>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
