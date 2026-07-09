"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";
import type { z } from "zod";
import { BanIcon, CopyIcon } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import type { PassportSummary } from "@rocky/validators/api";
import { reprintPassportRequestSchema, seizePassportRequestSchema } from "@rocky/validators/api";
import { DEATH_CAUSE, PASSPORT_STATUS } from "@rocky/validators/enums";
import { enumToOptions } from "#lib/options";
import { DateField, SelectField } from "#components/shared/form-fields";
import { ActionDialog, RowActionMenu, type RowMenuItem } from "#components/shared/action-dialog";

export type { PassportSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const PASSPORT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [PASSPORT_STATUS.ISSUED]: "default",
  [PASSPORT_STATUS.ACTIVE]: "default",
  [PASSPORT_STATUS.SEIZED]: "destructive",
  [PASSPORT_STATUS.ARCHIVED]: "secondary",
  [PASSPORT_STATUS.REPRINTED]: "secondary",
  [PASSPORT_STATUS.CANCELLED]: "secondary",
};

export function passportColumns(opts: {
  seize: { mutate: (v: z.input<typeof seizePassportRequestSchema>) => void; isPending: boolean };
  reprint: { mutate: (v: z.input<typeof reprintPassportRequestSchema>) => void; isPending: boolean };
}): ColumnDef<PassportSummary>[] {
  return [
    { accessorKey: "passportNumber", header: "Passport #" },
    { accessorKey: "animalId", header: "Animal", enableSorting: false },
    { accessorKey: "farmId", header: "Farm", enableSorting: false },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={PASSPORT_STATUS_VARIANT[row.original.status] ?? "outline"}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Issued",
      cell: ({ row }) => (row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString() : "\u2014"),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const items: RowMenuItem[] = [
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Seize"
                icon={BanIcon}
                schema={seizePassportRequestSchema}
                mutation={opts.seize}
                title="Seize passport"
                description="Records the animal's death and withdraws the passport."
                alert="This action is irreversible and marks the passport as seized."
                defaultValues={{ passportId: row.original.id }}
                fields={(form) => (
                  <>
                    <DateField control={form.control} name="deathDate" label="Death date" />
                    <SelectField
                      control={form.control}
                      name="deathCause"
                      label="Cause of death"
                      options={enumToOptions(Object.values(DEATH_CAUSE))}
                    />
                  </>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Reprint"
                icon={CopyIcon}
                schema={reprintPassportRequestSchema}
                mutation={opts.reprint}
                title="Reprint passport"
                description="Issues a duplicate passport for this animal."
                defaultValues={{ originalPassportId: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">
                    A new passport will be printed and the original marked as reprinted.
                  </p>
                )}
              />
            ),
          },
        ];
        return <RowActionMenu items={items} />;
      },
    },
  ];
}
