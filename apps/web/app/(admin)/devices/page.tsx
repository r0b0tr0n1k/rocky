"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { deviceColumns, type PdaDeviceSummary } from "#components/devices/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

export default function DevicesPage() {
  const router = useRouter();
  const trpc = useTRPC();

  // device.list input is { status?, search? } (no limit/offset) — returns all + total.
  const listQuery = useQuery(trpc.device.list.queryOptions({}));

  const rows = (listQuery.data?.data ?? []) as PdaDeviceSummary[];
  const total = listQuery.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="PDA Devices"
        description="Field devices running the mobile app."
        actions={
          <Button onClick={() => router.push("/devices/new")}>
            <Plus /> Register device
          </Button>
        }
      />
      <DataTable columns={deviceColumns} data={rows} total={total} isLoading={listQuery.isLoading} />
    </div>
  );
}
