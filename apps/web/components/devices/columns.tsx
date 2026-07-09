"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";

import { StatusBadge } from "#components/shared/status-badge";
import { Badge } from "@rocky/ui/components/badge";
import { PencilIcon } from "lucide-react";
import { RowActions } from "#components/shared/row-actions";
import type { PdaDeviceSummary } from "@rocky/validators/api";
import { DEVICE_STATUS } from "@rocky/validators/enums";

export type { PdaDeviceSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const DEVICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [DEVICE_STATUS.ACTIVE]: "default",
  [DEVICE_STATUS.BLOCKED]: "destructive",
  [DEVICE_STATUS.RETIRED]: "secondary",
};

export const deviceColumns: ColumnDef<PdaDeviceSummary>[] = [
  { accessorKey: "deviceIdentifier", header: "Device ID", enableSorting: false },
  { accessorKey: "name", header: "Name", enableSorting: false, cell: ({ row }) => row.original.name ?? "\u2014" },
  { accessorKey: "deviceType", header: "Type", enableSorting: false },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge value={row.original.status} map={DEVICE_STATUS_VARIANT} />,
  },
  {
    accessorKey: "lastSyncAt",
    header: "Last sync",
    enableSorting: false,
    cell: ({ row }) => (row.original.lastSyncAt ? new Date(row.original.lastSyncAt).toLocaleString() : "\u2014"),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <RowActions actions={[{ label: "Edit", icon: PencilIcon, href: `/devices/${row.original.id}/edit` }]} />
    ),
  },
];
