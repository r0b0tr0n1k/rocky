"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rocky/ui/components/breadcrumb";
import { Button } from "@rocky/ui/components/button";
import { StatCard } from "@rocky/ui/components/stat-card";
import type { SORT_ANIMAL_BY } from "@rocky/validators/enums";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Building2, ClipboardCheck, PawPrint, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { type AnimalSummary, animalColumns } from "#components/animals/columns";
import { useTotals } from "#components/dashboard/analytics";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { SearchInput, TableCard, tableDensityClass } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { useDebounced } from "#lib/use-debounced";

type SortKey = (typeof SORT_ANIMAL_BY)[keyof typeof SORT_ANIMAL_BY];

export default function AnimalsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(null);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search);
  const pageSize = 20;

  const listQuery = useQuery(
    trpc.animal.list.queryOptions({
      limit: pageSize,
      offset: page * pageSize,
      search: debouncedSearch || undefined,
      sortBy: sort ? (sort.id as SortKey) : undefined,
      sortOrder: sort?.desc ? "desc" : "asc",
    }),
  );

  const rows = (listQuery.data?.data ?? []) as AnimalSummary[];
  const total = listQuery.data?.total ?? 0;
  const totals = useTotals();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Animals"
        description="Registered cattle across all farms."
        status={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Live
          </span>
        }
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Animals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Animals" value={totals.animals} hint="Registered cattle" icon={PawPrint} accent="primary" />
        <StatCard label="Farms" value={totals.farms} hint="Active holdings" icon={Building2} accent="emerald" />
        <StatCard
          label="Movements"
          value={totals.movements}
          hint="Recorded transfers"
          icon={ArrowLeftRight}
          accent="amber"
        />
        <StatCard
          label="Inspections"
          value={totals.inspections}
          hint="On-site visits"
          icon={ClipboardCheck}
          accent="violet"
        />
      </div>
      <TableCard
        toolbarLeft={<SearchInput value={search} onChange={setSearch} placeholder="Search animals…" />}
        action={
          <Button onClick={() => router.push("/animals/new")}>
            <Plus /> Register animal
          </Button>
        }
      >
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
          bordered={false}
          tableClassName={tableDensityClass}
        />
      </TableCard>
    </div>
  );
}
