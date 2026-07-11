"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { StatusBadge } from "#components/shared/status-badge";
import { Button } from "@rocky/ui/components/button";
import type { EarTagOrderResponse } from "@rocky/validators/api";

export function earTagOrderColumns({
  onViewLifecycle,
}: {
  onViewLifecycle: (o: EarTagOrderResponse) => void;
}): ColumnDef<EarTagOrderResponse>[] {
  return [
    { accessorKey: "supplierName", header: "Supplier", cell: ({ row }) => row.original.supplierName ?? "—" },
    { accessorKey: "quantity", header: "Qty" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onViewLifecycle(row.original)}>
          <Eye data-icon="inline-start" /> Lifecycle
        </Button>
      ),
    },
  ];
}
