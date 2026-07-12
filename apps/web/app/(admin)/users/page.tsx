"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { userColumns, type UserSummary } from "#components/users/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { TableCard, tableDensityClass } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { usePermissions } from "#lib/permissions";
import { SORT_BY_USER } from "@rocky/validators/enums";

type SortKey = (typeof SORT_BY_USER)[keyof typeof SORT_BY_USER];

export default function UsersPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { roles } = usePermissions();
  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const [page, setPage] = React.useState(0);
  const [sort, setSort] = React.useState<{ id: string; desc: boolean } | null>(null);
  const pageSize = 50;

  const listQuery = useQuery(
    trpc.user.list.queryOptions({
      limit: pageSize,
      offset: page * pageSize,
      sortBy: sort ? (sort.id as SortKey) : undefined,
      sortOrder: sort?.desc ? "desc" : "asc",
    }),
  );

  // user.list returns a bare array (no total) — render without the pager.
  const rows = (listQuery.data ?? []) as UserSummary[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="System Management user accounts."
      />
      <TableCard
        action={
          isSuperAdmin ? (
            <Button onClick={() => router.push("/users/new")}>
              <Plus /> New user
            </Button>
          ) : undefined
        }
      >
        <DataTable columns={userColumns} data={rows} total={rows.length} isLoading={listQuery.isLoading} sort={sort} onSortChange={setSort} bordered={false} tableClassName={tableDensityClass} />
      </TableCard>
    </div>
  );
}
