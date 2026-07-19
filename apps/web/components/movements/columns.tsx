"use client";

import { format } from "date-fns";
import type { ComponentProps } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileDown, FileText, PencilIcon } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import { RowActions } from "#components/shared/row-actions";
import { StatusBadge } from "#components/shared/status-badge";
import { MOVEMENT_TYPE } from "@rocky/validators/enums";
import type { MovementResponse } from "@rocky/validators/api";

export type { MovementResponse } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Styling map for movement type badge variant. */
export const MOVEMENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  [MOVEMENT_TYPE.SALE]: "outline",
  [MOVEMENT_TYPE.PURCHASE]: "outline",
  [MOVEMENT_TYPE.MARKET_SALE]: "outline",
  [MOVEMENT_TYPE.MARKET_PURCHASE]: "outline",
  [MOVEMENT_TYPE.TRANSFER]: "secondary",
  [MOVEMENT_TYPE.BIRTH_REGISTRATION]: "default",
  [MOVEMENT_TYPE.DEATH]: "destructive",
  [MOVEMENT_TYPE.HOME_SLAUGHTER]: "destructive",
  [MOVEMENT_TYPE.SLAUGHTERHOUSE]: "destructive",
  [MOVEMENT_TYPE.PASTURE_DEPARTURE]: "secondary",
  [MOVEMENT_TYPE.PASTURE_RETURN]: "secondary",
  [MOVEMENT_TYPE.IMPORT]: "outline",
  [MOVEMENT_TYPE.EXPORT]: "outline",
  [MOVEMENT_TYPE.ALPINE_DEPARTURE]: "secondary",
  [MOVEMENT_TYPE.ALPINE_RETURN]: "secondary",
  [MOVEMENT_TYPE.CORRECTION]: "outline",
};

export interface MovementColumnLookups {
  animalLabel: (id: string) => string;
  farmLabel: (id: string | null | undefined) => string;
}

// Only "movementDate" and "createdAt" are valid server sort keys; the rest
// would be rejected by movementListRequestSchema, so they are non-sortable.
export function movementColumns({
  animalLabel,
  farmLabel,
}: MovementColumnLookups): ColumnDef<MovementResponse>[] {
  return [
    {
      accessorKey: "animalId",
      header: "Animal",
      enableSorting: false,
      cell: ({ row }) => animalLabel(row.original.animalId),
    },
    {
      accessorKey: "fromFarmId",
      header: "From",
      enableSorting: false,
      cell: ({ row }) => farmLabel(row.original.fromFarmId),
    },
    {
      accessorKey: "toFarmId",
      header: "To",
      enableSorting: false,
      cell: ({ row }) => farmLabel(row.original.toFarmId),
    },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.type} map={MOVEMENT_TYPE_VARIANT} />,
    },
    {
      accessorKey: "movementDate",
      header: "Movement date",
      cell: ({ row }) => format(row.original.movementDate, "PP"),
    },
    {
      accessorKey: "isActive",
      header: "Active",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: "View", icon: PencilIcon, href: `/movements/${row.original.id}/edit` },
            { label: "Generate PDF", icon: FileDown, href: `/documents?type=movement&refId=${row.original.id}` },
            { label: "Generate YAML", icon: FileText, href: `/documents?type=movement&refId=${row.original.id}&format=yaml` },
          ]}
        />
      ),
    },
  ];
}
