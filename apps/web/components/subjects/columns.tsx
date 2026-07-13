"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@rocky/ui/components/badge";
import { PencilIcon } from "lucide-react";
import { RowActions } from "#components/shared/row-actions";
import type { SubjectSummary } from "@rocky/validators/api";

export type { SubjectSummary } from "@rocky/validators/api";

export const subjectColumns: ColumnDef<SubjectSummary>[] = [
  { accessorKey: "shortName", header: "Short name" },
  {
    accessorKey: "firstName",
    header: "First name",
    enableSorting: false,
    cell: ({ row }) => row.original.firstName ?? "\u2014",
  },
  {
    accessorKey: "lastName",
    header: "Last name",
    enableSorting: false,
    cell: ({ row }) => row.original.lastName ?? "\u2014",
  },
  {
    accessorKey: "personalId",
    header: "Personal ID",
    enableSorting: false,
    cell: ({ row }) => row.original.personalId ?? "\u2014",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    enableSorting: false,
    cell: ({ row }) => row.original.phoneNumber ?? "\u2014",
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
    id: "edit",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <RowActions actions={[{ label: "Edit", icon: PencilIcon, href: `/subjects/${row.original.id}/edit` }]} />
    ),
  },
];
