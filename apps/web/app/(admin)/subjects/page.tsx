"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { skipToken, useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { Input } from "@rocky/ui/components/input";
import { subjectColumns, type SubjectSummary } from "#components/subjects/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

export default function SubjectsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  // subject.search requires q (min 1); skip the query until the user types.
  const searchQuery = useQuery(
    trpc.subject.search.queryOptions(
      q.trim() ? { q: q.trim(), limit: pageSize, offset: page * pageSize } : skipToken,
    ),
  );

  const rows = (searchQuery.data?.data ?? []) as SubjectSummary[];
  const total = searchQuery.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description="Farmers, vets, and other human agents in the I&R system."
        actions={
          <Button onClick={() => router.push("/subjects/new")}>
            <Plus /> New subject
          </Button>
        }
      />
      <Input
        placeholder="Search subjects by name or ID…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
      />
      <DataTable
        columns={subjectColumns}
        data={rows}
        total={total}
        isLoading={searchQuery.isLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
