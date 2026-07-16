"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { TableCard, tableDensityClass } from "#components/shared/table-card";
import { movementColumns, type MovementResponse } from "#components/movements/columns";
import { SORT_BY_MOVEMENT } from "@rocky/validators/enums";
import type { AnimalSummary, FarmResponse } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";

type SortKey = (typeof SORT_BY_MOVEMENT)[keyof typeof SORT_BY_MOVEMENT];

export default function MovementsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>({
    id: SORT_BY_MOVEMENT.MOVEMENT_DATE,
    desc: true,
  });
  const pageSize = 20;

  const trpc = useTRPC();
  const listQuery = useQuery(
    trpc.movement.list.queryOptions({
      limit: pageSize,
      offset: page * pageSize,
      sortBy: sort ? (sort.id as SortKey) : undefined,
      sortOrder: sort?.desc ? "desc" : "asc",
    }),
  );
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));

  const rows = (listQuery.data?.data ?? []) as MovementResponse[];
  const total = listQuery.data?.total ?? 0;

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => {
    farmMap.set(f.id, f);
  });
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => {
    animalMap.set(a.id, a);
  });

  const farmLabel = (id?: string | null) => {
    if (!id) return "—";
    const f = farmMap.get(id);
    return f ? `${f.farmId} · ${f.name}` : id;
  };
  const animalLabel = (id: string) => {
    const a = animalMap.get(id);
    return a ? `${a.stateCode}${a.earTagNumber}` : id;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Movements" description="Livestock movements across farms and borders." />
      <TableCard
        action={
          <Button onClick={() => router.push("/movements/new")}>
            <Plus /> Record movement
          </Button>
        }
      >
        <DataTable
          columns={movementColumns({ animalLabel, farmLabel })}
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
