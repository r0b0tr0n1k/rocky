"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps } from "react";
import type { z } from "zod";
import { PencilIcon } from "lucide-react";

import { StatusBadge } from "#components/shared/status-badge";
import { Badge } from "@rocky/ui/components/badge";
import { ComboboxField } from "#components/shared/form-fields";
import { ActionDialog, RowActionMenu, type RowMenuItem } from "#components/shared/action-dialog";
import type { PdaDeviceSummary } from "@rocky/validators/api";
import {
  assignDeviceUserRequestSchema,
  recordSyncRequestSchema,
  registerFailedAttemptDeviceRequestSchema,
  unblockDeviceRequestSchema,
} from "@rocky/validators/api";
import { DEVICE_STATUS } from "@rocky/validators/enums";

export type { PdaDeviceSummary } from "@rocky/validators/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const DEVICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  [DEVICE_STATUS.ACTIVE]: "default",
  [DEVICE_STATUS.BLOCKED]: "destructive",
  [DEVICE_STATUS.RETIRED]: "secondary",
};

export type DeviceColumnLookups = {
  userOptions: { value: string; label: string }[];
};

export function deviceColumns(opts: DeviceColumnLookups & {
  assignUser: { mutate: (v: z.input<typeof assignDeviceUserRequestSchema>) => void; isPending: boolean };
  recordSync: { mutate: (v: z.input<typeof recordSyncRequestSchema>) => void; isPending: boolean };
  registerFailedAttempt: { mutate: (v: z.input<typeof registerFailedAttemptDeviceRequestSchema>) => void; isPending: boolean };
  unblock: { mutate: (v: z.input<typeof unblockDeviceRequestSchema>) => void; isPending: boolean };
}): ColumnDef<PdaDeviceSummary>[] {
  return [
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
    cell: ({ row }) => {
      const items: RowMenuItem[] = [
{ type: "link", label: "Edit", icon: PencilIcon, href: `/devices/${row.original.id}/edit` },
{
type: "dialog",
dialog: (
<ActionDialog
as="menuitem"
triggerLabel="Assign user"
schema={assignDeviceUserRequestSchema}
mutation={opts.assignUser}
title="Assign user to device"
defaultValues={{ deviceId: row.original.id }}
fields={(form) => (
<ComboboxField control={form.control} name="userId" label="User" options={opts.userOptions} />
)}
/>
),
},
{
type: "dialog",
dialog: (
<ActionDialog
as="menuitem"
triggerLabel="Record sync"
schema={recordSyncRequestSchema}
mutation={opts.recordSync}
title="Record sync"
description="Logs a sync event for this device."
defaultValues={{ deviceId: row.original.id }}
fields={() => (
<p className="text-sm text-muted-foreground">Confirm recording a sync event for this device.</p>
)}
/>
),
},
{
type: "dialog",
dialog: (
<ActionDialog
as="menuitem"
triggerLabel="Register failed attempt"
schema={registerFailedAttemptDeviceRequestSchema}
mutation={opts.registerFailedAttempt}
title="Register failed attempt"
alert="Logs a failed unlock attempt for this device."
defaultValues={{ deviceId: row.original.id }}
fields={() => (
<p className="text-sm text-muted-foreground">Confirm logging a failed unlock attempt.</p>
)}
/>
),
},
{
type: "dialog",
dialog: (
<ActionDialog
as="menuitem"
triggerLabel="Unblock"
schema={unblockDeviceRequestSchema}
mutation={opts.unblock}
title="Unblock device"
alert="This removes the blocked state from the device."
defaultValues={{ deviceId: row.original.id }}
fields={() => (
<p className="text-sm text-muted-foreground">Confirm unblocking this device.</p>
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
