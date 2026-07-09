"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";

import { StatusBadge } from "#components/shared/status-badge";
import { Badge } from "@rocky/ui/components/badge";
import { PencilIcon } from "lucide-react";
import { RowActions } from "#components/shared/row-actions";
import type { FarmSummary } from "@rocky/validators/api";
import { VERIFICATION_STATUS } from "@rocky/validators/enums";

export type { FarmSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Styling map for farm verification-status badge variant. */
const VERIFICATION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [VERIFICATION_STATUS.DRAFT]: "outline",
  [VERIFICATION_STATUS.PENDING_VD_APPROVAL]: "outline",
  [VERIFICATION_STATUS.APPROVED]: "default",
  [VERIFICATION_STATUS.REJECTED]: "destructive",
  [VERIFICATION_STATUS.ARCHIVED]: "secondary",
};

// Valid server sort keys (SORT_BY_FARM). Other columns are non-sortable.
export const farmColumns: ColumnDef<FarmSummary>[] = [
  { accessorKey: "farmId", header: "Farm ID", cell: ({ row }) => row.original.farmId },
  { accessorKey: "name", header: "Name", cell: ({ row }) => row.original.name ?? "\u2014" },
  { accessorKey: "type", header: "Type", enableSorting: false, cell: ({ row }) => row.original.type },
  {
    accessorKey: "verificationStatus",
    header: "Verification",
    cell: ({ row }) => <StatusBadge value={row.original.verificationStatus} map={VERIFICATION_STATUS_VARIANT} />,
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
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "\u2014",
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <RowActions actions={[{ label: "Edit", icon: PencilIcon, href: `/farms/${row.original.id}/edit` }]} />
    ),
  },
];
