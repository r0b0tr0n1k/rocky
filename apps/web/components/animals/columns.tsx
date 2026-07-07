"use client";

import type { ComponentProps } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "#components/shared/status-badge";
import { ANIMAL_STATUS } from "@rocky/validators/enums";
import { Badge } from "@rocky/ui/components/badge";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** value -> Badge variant for animal status (styling map, not an enum). */
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

/** Subset of AnimalSummary surfaced in tables (API returns the rest). */
export interface AnimalRow {
  id: string;
  stateCode: string;
  earTagNumber: string;
  sex: string;
  breed: string | null;
  status: string;
  currentFarmId: string;
  birthDate: string | Date;
}

// Only "earTagNumber" is a valid server sort key; the rest would be
// rejected by animalListRequestSchema, so they are non-sortable.
export const animalColumns: ColumnDef<AnimalRow>[] = [
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
];
