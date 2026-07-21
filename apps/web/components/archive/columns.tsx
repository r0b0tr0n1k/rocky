"use client";

import { Badge } from "@rocky/ui/components/badge";
import { type ArchiveDocumentResponse, markDestroyedArchiveRequestSchema } from "@rocky/validators/api";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/validators/enums";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EyeIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { z } from "zod";
import { ActionDialog, RowActionMenu, type RowMenuItem } from "#components/shared/action-dialog";
import { StatusBadge } from "#components/shared/status-badge";

export type { ArchiveDocumentResponse } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

/** Styling map for archive document type badge variant. */
export const ARCHIVE_DOCUMENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  [ARCHIVE_DOCUMENT_TYPE.PASSPORT]: "outline",
  [ARCHIVE_DOCUMENT_TYPE.CENSUS_FORM]: "secondary",
  [ARCHIVE_DOCUMENT_TYPE.TAGGING_RECEIPT]: "secondary",
  [ARCHIVE_DOCUMENT_TYPE.ORDER_FORM]: "secondary",
  [ARCHIVE_DOCUMENT_TYPE.INSPECTION_FORM]: "outline",
  [ARCHIVE_DOCUMENT_TYPE.SLAUGHTER_LIST]: "secondary",
  [ARCHIVE_DOCUMENT_TYPE.CORRESPONDENCE]: "outline",
  [ARCHIVE_DOCUMENT_TYPE.OTHER]: "outline",
};

/** Styling map for archive location (tier) badge variant. */
export const ARCHIVE_LOCATION_VARIANT: Record<string, BadgeVariant> = {
  [ARCHIVE_LOCATION.CPC]: "default",
  [ARCHIVE_LOCATION.VS]: "secondary",
  [ARCHIVE_LOCATION.VI]: "outline",
  [ARCHIVE_LOCATION.BIP]: "outline",
};

export interface ArchiveColumnLookups {
  animalLabel: (id: string | null | undefined) => string;
  farmLabel: (id: string | null | undefined) => string;
}

// archiveDocumentListRequestSchema has no sortBy, so no column is server-sortable.
export function archiveColumns({
  animalLabel,
  farmLabel,
  markDestroyed,
}: ArchiveColumnLookups & {
  markDestroyed: { mutate: (v: z.input<typeof markDestroyedArchiveRequestSchema>) => void; isPending: boolean };
}): ColumnDef<ArchiveDocumentResponse>[] {
  return [
    {
      accessorKey: "documentType",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.documentType} map={ARCHIVE_DOCUMENT_TYPE_VARIANT} />,
    },
    {
      accessorKey: "documentRef",
      header: "Ref",
      enableSorting: false,
      cell: ({ row }) => row.original.documentRef ?? "—",
    },
    {
      accessorKey: "archiveLocation",
      header: "Location",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.archiveLocation} map={ARCHIVE_LOCATION_VARIANT} />,
    },
    {
      accessorKey: "farmId",
      header: "Farm",
      enableSorting: false,
      cell: ({ row }) => farmLabel(row.original.farmId),
    },
    {
      accessorKey: "animalId",
      header: "Animal",
      enableSorting: false,
      cell: ({ row }) => animalLabel(row.original.animalId),
    },
    {
      accessorKey: "isArchived",
      header: "Archived",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isArchived ? (
          <Badge variant="default">Archived</Badge>
        ) : (
          <Badge variant="secondary">Pending</Badge>
        ),
    },
    {
      accessorKey: "retentionExpiry",
      header: "Retention",
      enableSorting: false,
      cell: ({ row }) => format(row.original.retentionExpiry, "PP"),
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
      cell: ({ row }) => {
        const items: RowMenuItem[] = [
          { type: "link", label: "View", icon: EyeIcon, href: `/archive/${row.original.id}/edit` },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Mark destroyed"
                schema={markDestroyedArchiveRequestSchema}
                mutation={markDestroyed}
                title="Mark document destroyed"
                alert="This permanently marks the document as destroyed after retention expiry."
                defaultValues={{ id: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">Confirm destruction of this archived document.</p>
                )}
              />
            ),
          },
        ];
        return <RowActionMenu items={items} />;
      },
    },
  ];
}
