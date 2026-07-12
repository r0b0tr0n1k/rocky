"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import type { VsContractResponse } from "@rocky/validators/api";
import { RowActionMenu } from "#components/shared/action-dialog";
import { RowDetailsDialog } from "#components/shared/row-details-dialog";

export function vsContractColumns({
  onView,
}: {
  onView: (c: VsContractResponse) => void;
}): ColumnDef<VsContractResponse>[] {
  return [
    { accessorKey: "contractNumber", header: "Contract #" },
    { accessorKey: "region", header: "Region" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
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
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActionMenu
          items={[
            { type: "action", label: "View", icon: Eye, onClick: () => onView(row.original) },
            {
              type: "dialog",
              dialog: (
                <RowDetailsDialog
                  title={row.original.contractNumber}
                  description="VS contract record"
                  fields={[
                    { label: "Contract #", value: row.original.contractNumber },
                    { label: "Region", value: row.original.region },
                    { label: "Status", value: row.original.status },
                    { label: "Start", value: new Date(row.original.startDate).toLocaleDateString() },
                    { label: "End", value: row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : "—" },
                    { label: "Created", value: new Date(row.original.createdAt).toLocaleDateString() },
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
