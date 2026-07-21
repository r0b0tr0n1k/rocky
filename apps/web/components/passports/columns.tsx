"use client";

import { Badge } from "@rocky/ui/components/badge";
import type { PassportSummary } from "@rocky/validators/api";
import {
  deliverToKeeperPassportRequestSchema,
  reprintPassportRequestSchema,
  seizePassportRequestSchema,
  shipToVsPassportRequestSchema,
} from "@rocky/validators/api";
import { DEATH_CAUSE, PASSPORT_STATUS } from "@rocky/validators/enums";
import type { ColumnDef } from "@tanstack/react-table";
import { BanIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { z } from "zod";
import { ActionDialog, RowActionMenu, type RowMenuItem } from "#components/shared/action-dialog";
import { DateField, SelectField } from "#components/shared/form-fields";
import { RowDetailsDialog } from "#components/shared/row-details-dialog";
import { enumToOptions } from "#lib/options";

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
  shipToVs: { mutate: (v: z.input<typeof shipToVsPassportRequestSchema>) => void; isPending: boolean };
  deliverToKeeper: { mutate: (v: z.input<typeof deliverToKeeperPassportRequestSchema>) => void; isPending: boolean };
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
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Ship to VS"
                schema={shipToVsPassportRequestSchema}
                mutation={opts.shipToVs}
                title="Ship passport to VS"
                description="Transfers physical custody of the passport to the veterinary station."
                defaultValues={{ passportId: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">
                    Confirm shipping this passport to the veterinary station.
                  </p>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Deliver to keeper"
                schema={deliverToKeeperPassportRequestSchema}
                mutation={opts.deliverToKeeper}
                title="Deliver passport to keeper"
                description="Marks the passport as handed to the animal keeper."
                defaultValues={{ passportId: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">Confirm delivery of this passport to the keeper.</p>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <RowDetailsDialog
                title={row.original.passportNumber}
                description="Cattle passport"
                fields={[
                  { label: "Passport #", value: row.original.passportNumber },
                  { label: "Status", value: row.original.status },
                  { label: "Animal", value: row.original.animalId },
                  { label: "Farm", value: row.original.farmId },
                  {
                    label: "Issued",
                    value: row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString() : "—",
                  },
                  { label: "Active", value: row.original.isActive ? "Yes" : "No" },
                ]}
              />
            ),
          },
        ];
        return <RowActionMenu items={items} />;
      },
    },
  ];
}
