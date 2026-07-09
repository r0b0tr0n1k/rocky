"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { organizationColumns, type OrganizationSummary } from "#components/organizations/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

export default function OrganizationsPage() {
  const router = useRouter();
  const trpc = useTRPC();

  // organization.list has no input and returns a bare array (no total) — no pager.
  const listQuery = useQuery(trpc.organization.list.queryOptions());
  const rows = (listQuery.data ?? []) as OrganizationSummary[];
  const orgsMap = Object.fromEntries(rows.map((o) => [o.id, o.name1]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Organizations"
        description="Veterinary Directorate administrative units."
        actions={
          <Button onClick={() => router.push("/organizations/new")}>
            <Plus /> New organization
          </Button>
        }
      />
      <DataTable
        columns={organizationColumns(orgsMap)}
        data={rows}
        total={rows.length}
        isLoading={listQuery.isLoading}
      />
    </div>
  );
}
