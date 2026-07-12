"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, PawPrint, ArrowLeftRight, ClipboardCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { StatCard } from "@rocky/ui/components/stat-card";
import { farmColumns, type FarmSummary } from "#components/farms/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHero } from "#components/shared/page-hero";
import { TableCard, tableDensityClass } from "#components/shared/table-card";
import { useTotals } from "#components/dashboard/analytics";
import { useTRPC } from "#lib/trpc";
import type { SORT_BY_FARM } from "@rocky/validators/enums";

type SortKey = (typeof SORT_BY_FARM)[keyof typeof SORT_BY_FARM];

export default function FarmsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(null);
  const pageSize = 20;

  const listQuery = useQuery(
    trpc.farm.list.queryOptions({
      limit: pageSize,
      offset: page * pageSize,
      sortBy: sort ? (sort.id as SortKey) : undefined,
      sortOrder: sort?.desc ? "desc" : "asc",
    }),
  );

  const rows = (listQuery.data?.data ?? []) as FarmSummary[];
  const total = listQuery.data?.total ?? 0;
  const totals = useTotals();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Farms"
        description="Registered holdings across the identification & registration system."
        live
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Animals" value={totals.animals} hint="Registered cattle" icon={PawPrint} accent="primary" />
        <StatCard label="Farms" value={totals.farms} hint="Active holdings" icon={Building2} accent="emerald" />
        <StatCard label="Movements" value={totals.movements} hint="Recorded transfers" icon={ArrowLeftRight} accent="amber" />
        <StatCard label="Inspections" value={totals.inspections} hint="On-site visits" icon={ClipboardCheck} accent="violet" />
      </div>
      <TableCard
        action={
          <Button onClick={() => router.push("/farms/new")}>
            <Plus /> Register farm
          </Button>
        }
      >
        <DataTable
          columns={farmColumns}
          data={rows}
          total={total}
          isLoading={listQuery.isLoading}
          sort={sort}
          onSortChange={setSort}
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
