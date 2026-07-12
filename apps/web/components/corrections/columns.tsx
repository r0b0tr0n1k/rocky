"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";
import type { z } from "zod";
import { EyeIcon } from "lucide-react";

import { Badge } from "@rocky/ui/components/badge";
import {
  escalateCorrectionRequestSchema,
  rejectCorrectionRequestSchema,
  resolveCorrectionRequestSchema,
  reviewCorrectionRequestSchema,
  type CorrectionResponse,
} from "@rocky/validators/api";
import { CORRECTION_STATUS, DETECTION_SOURCE } from "@rocky/validators/enums";
import { enumToOptions } from "#lib/options";
import { SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { ActionDialog, RowActionMenu, type RowMenuItem } from "#components/shared/action-dialog";
import { RowDetailsDialog } from "#components/shared/row-details-dialog";

export type { CorrectionResponse } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const CORRECTION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [CORRECTION_STATUS.PENDING]: "outline",
  [CORRECTION_STATUS.UNDER_REVIEW]: "secondary",
  [CORRECTION_STATUS.RESOLVED]: "default",
  [CORRECTION_STATUS.ESCALATED]: "destructive",
  [CORRECTION_STATUS.REJECTED]: "secondary",
};

export function correctionColumns(opts: {
  review: { mutate: (v: z.input<typeof reviewCorrectionRequestSchema>) => void; isPending: boolean };
  resolve: { mutate: (v: z.input<typeof resolveCorrectionRequestSchema>) => void; isPending: boolean };
  escalate: { mutate: (v: z.input<typeof escalateCorrectionRequestSchema>) => void; isPending: boolean };
  reject: { mutate: (v: z.input<typeof rejectCorrectionRequestSchema>) => void; isPending: boolean };
}): ColumnDef<CorrectionResponse>[] {
  return [
    { accessorKey: "errorType", header: "Error type", enableSorting: false },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={CORRECTION_STATUS_VARIANT[row.original.status] ?? "outline"}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "detectionSource",
      header: "Source",
      enableSorting: false,
      cell: ({ row }) => <Badge variant="outline">{row.original.detectionSource}</Badge>,
    },
    { accessorKey: "farmId", header: "Farm", enableSorting: false, cell: ({ row }) => row.original.farmId ?? "\u2014" },
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => row.original.animalId ?? "\u2014" },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const items: RowMenuItem[] = [
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Review"
                schema={reviewCorrectionRequestSchema}
                mutation={opts.review}
                title="Review correction"
                description="Marks the case as reviewed and assigns it for resolution."
                defaultValues={{ id: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">Confirm review of this correction case.</p>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Resolve"
                schema={resolveCorrectionRequestSchema}
                mutation={opts.resolve}
                title="Resolve correction"
                defaultValues={{ id: row.original.id }}
                fields={(form) => (
                  <TextareaField control={form.control} name="resolutionNotes" label="Resolution notes" />
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Escalate"
                schema={escalateCorrectionRequestSchema}
                mutation={opts.escalate}
                title="Escalate correction"
                alert="Escalating hands the case to a higher authority."
                defaultValues={{ id: row.original.id }}
                fields={(form) => (
                  <>
                    <TextField control={form.control} name="escalatedTo" label="Escalated to (subject ID)" placeholder="UUID" />
                    <TextareaField control={form.control} name="reason" label="Reason" />
                  </>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <ActionDialog
                as="menuitem"
                triggerLabel="Reject"
                schema={rejectCorrectionRequestSchema}
                mutation={opts.reject}
                title="Reject correction"
                alert="Rejecting closes the case as not actionable."
                defaultValues={{ id: row.original.id }}
                fields={() => (
                  <p className="text-sm text-muted-foreground">Confirm rejection of this correction case.</p>
                )}
              />
            ),
          },
          {
            type: "dialog",
            dialog: (
              <RowDetailsDialog
                title={row.original.errorType}
                description="Correction case"
                fields={[
                  { label: "Error type", value: row.original.errorType },
                  { label: "Status", value: row.original.status },
                  { label: "Source", value: row.original.detectionSource },
                  { label: "Case type", value: row.original.caseType ?? "—" },
                  { label: "Farm", value: row.original.farmId ?? "—" },
                  { label: "Animal", value: row.original.animalId ?? "—" },
                ]}
              />
            ),
          },
        ];
        return <RowActionMenu items={items} />;
      },
    },
  ];
}
