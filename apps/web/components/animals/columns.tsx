"use client";

import type { ComponentProps } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "#components/shared/status-badge";
import type { AnimalSummary } from "@rocky/validators/api";
import { ANIMAL_STATUS } from "@rocky/validators/enums";
import { Badge } from "@rocky/ui/components/badge";
import { PencilIcon } from "lucide-react";
import { RowActions } from "#components/shared/row-actions";

export type { AnimalSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Styling map for animal status badge variant. */
const ANIMAL_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [ANIMAL_STATUS.ALIVE]: "default",
  [ANIMAL_STATUS.DEAD]: "secondary",
  [ANIMAL_STATUS.SLAUGHTERED]: "destructive",
  [ANIMAL_STATUS.SOLD]: "outline",
  [ANIMAL_STATUS.EXPORTED]: "outline",
  [ANIMAL_STATUS.IMPORTED]: "outline",
  [ANIMAL_STATUS.MISSING]: "destructive",
  [ANIMAL_STATUS.STILLBORN]: "secondary",
};

// Only "earTagNumber" is a valid server sort key; the rest would be
// rejected by animalListRequestSchema, so they are non-sortable.
export const animalColumns: ColumnDef<AnimalSummary>[] = [
  { accessorKey: "stateCode", header: "State", enableSorting: false, cell: ({ row }) => row.original.stateCode },
  { accessorKey: "earTagNumber", header: "Ear tag", cell: ({ row }) => row.original.earTagNumber },
  { accessorKey: "sex", header: "Sex", enableSorting: false },
  { accessorKey: "breed", header: "Breed", enableSorting: false, cell: ({ row }) => row.original.breed ?? "—" },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge value={row.original.status} map={ANIMAL_STATUS_VARIANT} />,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <RowActions actions={[{ label: "Edit", icon: PencilIcon, href: `/animals/${row.original.id}/edit` }]} />
    ),
  },
];
