"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";

import { StatusBadge } from "#components/shared/status-badge";
import { Badge } from "@rocky/ui/components/badge";
import { PencilIcon } from "lucide-react";
import { RowActions } from "#components/shared/row-actions";
import type { UserSummary } from "@rocky/validators/api";
import { USER_STATUS } from "@rocky/validators/enums";

export type { UserSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const USER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [USER_STATUS.ACTIVE]: "default",
  [USER_STATUS.INACTIVE]: "secondary",
  [USER_STATUS.BLOCKED]: "destructive",
  [USER_STATUS.PENDING_VERIFICATION]: "outline",
};

// SORT_BY_USER = username | createdAt | lastLoginAt. status is NOT a valid sort key.
export const userColumns: ColumnDef<UserSummary>[] = [
  { accessorKey: "username", header: "Username" },
  { accessorKey: "email", header: "Email", enableSorting: false, cell: ({ row }) => row.original.email ?? "\u2014" },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge value={row.original.status} map={USER_STATUS_VARIANT} />,
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last login",
    cell: ({ row }) => (row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleString() : "\u2014"),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <RowActions actions={[{ label: "Edit", icon: PencilIcon, href: `/users/${row.original.id}/edit` }]} />
    ),
  },
];
