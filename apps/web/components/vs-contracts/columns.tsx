"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import type { VsContractResponse } from "@rocky/validators/api";

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
        <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
          <Eye data-icon="inline-start" /> View
        </Button>
      ),
    },
  ];
}
