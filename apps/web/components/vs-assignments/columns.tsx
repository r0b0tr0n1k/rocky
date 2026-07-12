"use client";

import { type ReactNode } from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@rocky/ui/components/badge";
import { RowActionMenu } from "#components/shared/action-dialog";
import { RowDetailsDialog } from "#components/shared/row-details-dialog";
import type { VsAssignmentResponse } from "@rocky/validators/api";

export function vsAssignmentColumns({
  renderUnassign,
}: {
  renderUnassign: (row: VsAssignmentResponse) => ReactNode;
}): ColumnDef<VsAssignmentResponse>[] {
  return [
    { accessorKey: "contractId", header: "Contract" },
    { accessorKey: "farmId", header: "Farm" },
    {
      accessorKey: "isPrimary",
      header: "Primary",
      cell: ({ row }) => (row.original.isPrimary ? <Badge>Primary</Badge> : null),
    },
    {
      accessorKey: "startDate",
      header: "Start",
      cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
    },
    {
      accessorKey: "endDate",
      header: "End",
      cell: ({ row }) =>
        row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : "—",
    },
    {
      accessorKey: "isActive",
      header: "State",
      cell: ({ row }) => (
        <Badge className={row.original.isActive ? "" : "text-muted-foreground"}>
          {row.original.isActive ? "active" : "ended"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionMenu
          items={[
            { type: "dialog", dialog: renderUnassign(row.original) },
            {
              type: "dialog",
              dialog: (
                <RowDetailsDialog
                  title="VS assignment"
                  description="Veterinary-service assignment"
                  fields={[
                    { label: "Contract", value: row.original.contractId },
                    { label: "Farm", value: row.original.farmId },
                    { label: "Primary", value: row.original.isPrimary ? "Yes" : "No" },
                    { label: "Start", value: new Date(row.original.startDate).toLocaleDateString() },
                    { label: "End", value: row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : "—" },
                    { label: "State", value: row.original.isActive ? "active" : "ended" },
                  ]}
                />
              ),
            },
          ]}
        />
      ),
    },
  ];
}
