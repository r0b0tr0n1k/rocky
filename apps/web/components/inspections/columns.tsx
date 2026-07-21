"use client";

import type { Badge } from "@rocky/ui/components/badge";
import type { InspectionResponse } from "@rocky/validators/api";
import { INSPECTION_STATUS } from "@rocky/validators/enums";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EyeIcon, FileDown } from "lucide-react";
import type { ComponentProps } from "react";
import { RowActions } from "#components/shared/row-actions";
import { StatusBadge } from "#components/shared/status-badge";

export type { InspectionResponse } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Styling map for inspection status badge variant. */
export const INSPECTION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [INSPECTION_STATUS.SCHEDULED]: "outline",
  [INSPECTION_STATUS.IN_PROGRESS]: "secondary",
  [INSPECTION_STATUS.COMPLETED]: "default",
  [INSPECTION_STATUS.CANCELLED]: "destructive",
};

export interface InspectionColumnLookups {
  farmLabel: (id: string) => string;
  inspectorLabel: (id: string) => string;
}

// inspectionListRequestSchema has no sortBy, so no column is server-sortable.
export function inspectionColumns({
  farmLabel,
  inspectorLabel,
}: InspectionColumnLookups): ColumnDef<InspectionResponse>[] {
  return [
    {
      accessorKey: "farmId",
      header: "Farm",
      enableSorting: false,
      cell: ({ row }) => farmLabel(row.original.farmId),
    },
    {
      accessorKey: "inspectorId",
      header: "Inspector",
      enableSorting: false,
      cell: ({ row }) => inspectorLabel(row.original.inspectorId),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.status} map={INSPECTION_STATUS_VARIANT} />,
    },
    {
      accessorKey: "scheduledDate",
      header: "Scheduled",
      enableSorting: false,
      cell: ({ row }) => (row.original.scheduledDate ? format(row.original.scheduledDate, "PP") : "—"),
    },
    {
      accessorKey: "inspectionDate",
      header: "Inspected",
      enableSorting: false,
      cell: ({ row }) => (row.original.inspectionDate ? format(row.original.inspectionDate, "PP") : "—"),
    },
    {
      accessorKey: "riskScore",
      header: "Risk",
      enableSorting: false,
      cell: ({ row }) => row.original.riskScore ?? "—",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: "View", icon: EyeIcon, href: `/inspections/${row.original.id}/edit` },
            {
              label: "Generate PDF",
              icon: FileDown,
              href: `/documents?type=inspection-form&refId=${row.original.id}`,
            },
          ]}
        />
      ),
    },
  ];
}
