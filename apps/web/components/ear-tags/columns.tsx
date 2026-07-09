"use client";

import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@rocky/ui/components/badge";
import { StatusBadge } from "#components/shared/status-badge";
import type { EarTagResponse, EarTagTypeResponse } from "@rocky/validators/api";

export type { EarTagResponse, EarTagTypeResponse } from "@rocky/validators/api";

export interface EarTagLookups {
  animalLabel: (id: string | null | undefined) => string;
  typeLabel: (id: string | null | undefined) => string;
}

export function earTagColumns({ animalLabel, typeLabel }: EarTagLookups): ColumnDef<EarTagResponse>[] {
  return [
    { accessorKey: "stateCode", header: "State", enableSorting: false, cell: ({ row }) => row.original.stateCode ?? "—" },
    { accessorKey: "tagNumber", header: "Tag no", enableSorting: false },
    { accessorKey: "typeId", header: "Type", enableSorting: false, cell: ({ row }) => typeLabel(row.original.typeId) },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    {
      accessorKey: "appliedDate",
      header: "Applied",
      enableSorting: false,
      cell: ({ row }) => (row.original.appliedDate ? format(row.original.appliedDate, "PP") : "—"),
    },
    {
      accessorKey: "expiryDate",
      header: "Expires",
      enableSorting: false,
      cell: ({ row }) => (row.original.expiryDate ? format(row.original.expiryDate, "PP") : "—"),
    },
    {
      accessorKey: "isDefective",
      header: "Defective",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isDefective ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge>,
    },
    { accessorKey: "orderId", header: "Order", enableSorting: false, cell: ({ row }) => row.original.orderId ?? "—" },
  ];
}

export function earTagTypeColumns(): ColumnDef<EarTagTypeResponse>[] {
  return [
    { accessorKey: "code", header: "Code", enableSorting: false },
    { accessorKey: "name", header: "Name", enableSorting: false },
    { accessorKey: "category", header: "Category", enableSorting: false, cell: ({ row }) => row.original.category ?? "—" },
    { accessorKey: "tagGender", header: "Gender", enableSorting: false, cell: ({ row }) => row.original.tagGender ?? "—" },
    { accessorKey: "color", header: "Color", enableSorting: false, cell: ({ row }) => row.original.color ?? "—" },
    { accessorKey: "supplier", header: "Supplier", enableSorting: false, cell: ({ row }) => row.original.supplier ?? "—" },
    {
      accessorKey: "isActive",
      header: "Active",
      enableSorting: false,
      cell: ({ row }) => (row.original.isActive ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>),
    },
  ];
}
