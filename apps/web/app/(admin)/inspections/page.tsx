"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { TableCard, tableDensityClass } from "#components/shared/table-card";
import { inspectionColumns, type InspectionResponse } from "#components/inspections/columns";
import { INSPECTION_STATUS, type inspectionStatusType } from "@rocky/validators/enums";
import type { FarmResponse, UserSummary } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";

export default function InspectionsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [status, setStatus] = React.useState<inspectionStatusType | undefined>(undefined);
  const pageSize = 20;

  const trpc = useTRPC();
  const listQuery = useQuery(trpc.inspection.list.queryOptions({
    status,
    limit: pageSize,
    offset: page * pageSize,
  }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));

  const rows = (listQuery.data?.data ?? []) as InspectionResponse[];
  const total = listQuery.data?.total ?? 0;

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => farmMap.set(f.id, f));
  const userMap = new Map<string, UserSummary>();
  ((users.data ?? []) as UserSummary[]).forEach((u) => userMap.set(u.id, u));

  const farmLabel = (id: string) => {
    const f = farmMap.get(id);
    return f ? `${f.farmId} · ${f.name}` : id;
  };
  const inspectorLabel = (id: string) => {
    const u = userMap.get(id);
    const name = u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";
    return name || (u?.username ?? id);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inspections"
        description="On-spot inspections, risk analysis, and form generation."
      />
      <TableCard
        toolbarLeft={
          <Select
            value={status ?? "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? undefined : (v as inspectionStatusType));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(INSPECTION_STATUS).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        action={
          <Button onClick={() => router.push("/inspections/new")}>
            <Plus /> New inspection
          </Button>
        }
      >
        <DataTable
          columns={inspectionColumns({ farmLabel, inspectorLabel })}
          data={rows}
          total={total}
          isLoading={listQuery.isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          bordered={false}
          tableClassName={tableDensityClass}
        />
      </TableCard>
    </div>
  );
}
