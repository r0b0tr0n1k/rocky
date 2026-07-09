"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@rocky/ui/components/badge";
import type { OrganizationSummary } from "@rocky/validators/api";

export type { OrganizationSummary } from "@rocky/validators/api";

export function organizationColumns(orgsMap: Record<string, string>): ColumnDef<OrganizationSummary>[] {
  return [
    { accessorKey: "name1", header: "Name", cell: ({ row }) => row.original.name1 },
    { accessorKey: "orgType", header: "Type", cell: ({ row }) => row.original.orgType },
    {
      accessorKey: "parentId",
      header: "Parent",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.parentId ? (orgsMap[row.original.parentId] ?? "\u2014") : "\u2014",
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
  ];
}
