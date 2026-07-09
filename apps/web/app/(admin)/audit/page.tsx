"use client";

import { Badge } from "@rocky/ui/components/badge";
import { Label } from "@rocky/ui/components/label";

import type { AuditResponse } from "@rocky/validators/api";
import { AUDIT_ACTION, type auditActionType } from "@rocky/validators/enums";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { StatusBadge } from "#components/shared/status-badge";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

const PAGE_SIZE = 20;

export default function AuditPage() {
  const trpc = useTRPC();
  const [action, setAction] = React.useState<auditActionType | undefined>(undefined);

  const auditQ = useQuery(trpc.audit.list.queryOptions({ limit: PAGE_SIZE, action }));

  const columns: ColumnDef<AuditResponse>[] = [
    {
      accessorKey: "createdAt",
      header: "When",
      enableSorting: false,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      accessorKey: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.action} />,
    },
    { accessorKey: "resource", header: "Resource", enableSorting: false },
    {
      accessorKey: "resourceId",
      header: "Resource ID",
      enableSorting: false,
      cell: ({ row }) => row.original.resourceId ?? "—",
    },
    { accessorKey: "userId", header: "User", enableSorting: false, cell: ({ row }) => row.original.userId ?? "—" },
    {
      accessorKey: "success",
      header: "Result",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.success ? <Badge variant="default">OK</Badge> : <Badge variant="destructive">Fail</Badge>,
    },
    {
      accessorKey: "source",
      header: "Source",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.source} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit log" description="Immutable record of domain mutations (read-only)." />
      <div className="flex items-center gap-2">
        <Label className="text-sm">Action</Label>
        <select
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          value={action ?? ""}
          onChange={(e) => setAction(e.target.value ? (e.target.value as auditActionType) : undefined)}
        >
          <option value="">All</option>
          {enumToOptions(Object.values(AUDIT_ACTION)).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        columns={columns}
        data={(auditQ.data?.data ?? []) as AuditResponse[]}
        total={auditQ.data?.total ?? 0}
        isLoading={auditQ.isLoading}
        page={0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
