"use client";

import { Badge } from "@rocky/ui/components/badge";
import type { FarmBookResponse } from "@rocky/validators/api";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { RowActionMenu } from "#components/shared/action-dialog";
import { RowDetailsDialog } from "#components/shared/row-details-dialog";

export function farmBookColumns({ onView }: { onView: (c: FarmBookResponse) => void }): ColumnDef<FarmBookResponse>[] {
  return [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "assembledAt",
      header: "Assembled",
      cell: ({ row }) => (row.original.assembledAt ? new Date(row.original.assembledAt).toLocaleDateString() : "—"),
    },
    {
      accessorKey: "deliveredAt",
      header: "Delivered",
      cell: ({ row }) => (row.original.deliveredAt ? new Date(row.original.deliveredAt).toLocaleDateString() : "—"),
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
                  title={`Farm book ${row.original.id}`}
                  description="Farm book record"
                  fields={[
                    { label: "Status", value: row.original.status },
                    { label: "Farm", value: row.original.farmId },
                    {
                      label: "Assembled",
                      value: row.original.assembledAt ? new Date(row.original.assembledAt).toLocaleDateString() : "—",
                    },
                    {
                      label: "Delivered",
                      value: row.original.deliveredAt ? new Date(row.original.deliveredAt).toLocaleDateString() : "—",
                    },
                    { label: "VS ID", value: row.original.vsId ?? "—" },
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
