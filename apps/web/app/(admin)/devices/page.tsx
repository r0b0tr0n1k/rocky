"use client";

import { Button } from "@rocky/ui/components/button";
import type { UserSummary } from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deviceColumns, type PdaDeviceSummary } from "#components/devices/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { SearchInput, TableCard, tableDensityClass } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { useDebounced } from "#lib/use-debounced";

export default function DevicesPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search);

  // device.list input is { status?, search? } (no limit/offset) — returns all + total.
  const listQuery = useQuery(trpc.device.list.queryOptions({ search: debouncedSearch || undefined }));

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.device.list.queryKey() });
  const assignUser = useMutation(trpc.device.assignUser.mutationOptions({ onSuccess: invalidate }));
  const recordSync = useMutation(trpc.device.recordSync.mutationOptions({ onSuccess: invalidate }));
  const registerFailedAttempt = useMutation(
    trpc.device.registerFailedAttempt.mutationOptions({ onSuccess: invalidate }),
  );
  const unblock = useMutation(trpc.device.unblock.mutationOptions({ onSuccess: invalidate }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100, offset: 0 }));
  const userOptions = (users.data ?? []).map((u: UserSummary) => ({ value: u.id, label: u.email ?? u.id }));

  const rows = (listQuery.data?.data ?? []) as PdaDeviceSummary[];
  const total = listQuery.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="PDA Devices" description="Field devices running the mobile app." />
      <TableCard
        toolbarLeft={<SearchInput value={search} onChange={setSearch} placeholder="Search devices…" />}
        action={
          <Button onClick={() => router.push("/devices/new")}>
            <Plus /> Register device
          </Button>
        }
      >
        <DataTable
          columns={deviceColumns({ userOptions, assignUser, recordSync, registerFailedAttempt, unblock })}
          data={rows}
          total={total}
          isLoading={listQuery.isLoading}
          bordered={false}
          tableClassName={tableDensityClass}
        />
      </TableCard>
    </div>
  );
}
