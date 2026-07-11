"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import type { FarmBookResponse } from "@rocky/validators/api";

export function farmBookColumns({
  onView,
}: {
  onView: (c: FarmBookResponse) => void;
}): ColumnDef<FarmBookResponse>[] {
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
      cell: ({ row }) =>
        row.original.assembledAt ? new Date(row.original.assembledAt).toLocaleDateString() : "—",
    },
    {
      accessorKey: "deliveredAt",
      header: "Delivered",
      cell: ({ row }) =>
        row.original.deliveredAt ? new Date(row.original.deliveredAt).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
          <Eye data-icon="inline-start" /> View
        </Button>
      ),
    },
  ];
}
