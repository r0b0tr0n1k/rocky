"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, PawPrint, Building2, ArrowLeftRight, ClipboardCheck } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import { StatCard } from "@rocky/ui/components/stat-card";
import { animalColumns, type AnimalSummary } from "#components/animals/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHero } from "#components/shared/page-hero";
import { useTotals } from "#components/dashboard/analytics";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import type { SORT_ANIMAL_BY } from "@rocky/validators/enums";

type SortKey = (typeof SORT_ANIMAL_BY)[keyof typeof SORT_ANIMAL_BY];

export default function AnimalsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(null);
  const pageSize = 20;

  const trpc = useTRPC();
  const listQuery = useQuery(trpc.animal.list.queryOptions({
    limit: pageSize,
    offset: page * pageSize,
    sortBy: sort ? (sort.id as SortKey) : undefined,
    sortOrder: sort?.desc ? "desc" : "asc",
  }));

  const rows = (listQuery.data?.data ?? []) as AnimalSummary[];
  const total = listQuery.data?.total ?? 0;
  const totals = useTotals();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Animals"
        description="Registered cattle across all farms."
        live
        actions={
          <Button onClick={() => router.push("/animals/new")}>
            <Plus /> Register animal
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Animals" value={totals.animals} hint="Registered cattle" icon={PawPrint} accent="primary" />
        <StatCard label="Farms" value={totals.farms} hint="Active holdings" icon={Building2} accent="emerald" />
        <StatCard label="Movements" value={totals.movements} hint="Recorded transfers" icon={ArrowLeftRight} accent="amber" />
        <StatCard label="Inspections" value={totals.inspections} hint="On-site visits" icon={ClipboardCheck} accent="violet" />
      </div>
      <DataTable
        columns={animalColumns}
        data={rows}
        total={total}
        isLoading={listQuery.isLoading}
        sort={sort}
        onSortChange={setSort}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
