"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import { animalColumns, type AnimalRow } from "#components/animals/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { trpc } from "#lib/trpc";
import { SORT_ANIMAL_BY } from "@rocky/validators/enums";

type SortKey = (typeof SORT_ANIMAL_BY)[keyof typeof SORT_ANIMAL_BY];

export default function AnimalsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(null);
  const pageSize = 20;

  const listQuery = trpc.animal.list.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    sortBy: sort ? (sort.id as SortKey) : undefined,
    sortOrder: sort?.desc ? "desc" : "asc",
  });

  const rows = (listQuery.data?.data ?? []) as AnimalRow[];
  const total = listQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Animals"
        description="Registered cattle across all farms."
        actions={
          <Button onClick={() => router.push("/animals/new")}>
            <Plus /> Register animal
          </Button>
        }
      />
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
