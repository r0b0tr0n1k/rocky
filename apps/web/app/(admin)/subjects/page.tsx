"use client";

import { Button } from "@rocky/ui/components/button";
import { Input } from "@rocky/ui/components/input";
import { bindSubjectToFarmRequestSchema } from "@rocky/validators/api";
import { SUBJECT_ROLE } from "@rocky/validators/enums";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ActionDialog, RowActionMenu } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField, SelectField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { appendRowActions, TableCard, tableDensityClass } from "#components/shared/table-card";
import { type SubjectSummary, subjectColumns } from "#components/subjects/columns";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

export default function SubjectsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  // subject.search requires q (min 1); skip the query until the user types.
  const searchQuery = useQuery(
    trpc.subject.search.queryOptions(q.trim() ? { q: q.trim(), limit: pageSize, offset: page * pageSize } : skipToken),
  );

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const farmOptions = ((farms.data?.data ?? []) as { id: string; farmId: string; name: string }[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const bindToFarm = useMutation(
    trpc.subject.bindToFarm.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.subject.search.queryKey() }),
    }),
  );

  const rows = (searchQuery.data?.data ?? []) as SubjectSummary[];
  const total = searchQuery.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Subjects" description="Farmers, vets, and other human agents in the I&R system." />
      <TableCard
        toolbarLeft={
          <Input
            placeholder="Search subjects by name or ID…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        }
        action={
          <Button onClick={() => router.push("/subjects/new")}>
            <Plus /> New subject
          </Button>
        }
      >
        <DataTable
          columns={appendRowActions(subjectColumns, (row) => (
            <RowActionMenu
              items={[
                {
                  type: "dialog",
                  dialog: (
                    <ActionDialog
                      as="menuitem"
                      triggerLabel="Bind to farm"
                      schema={bindSubjectToFarmRequestSchema}
                      mutation={bindToFarm}
                      title="Bind subject to farm"
                      description="Assign a farm role for this subject."
                      defaultValues={{ subjectId: row.id }}
                      fields={(form) => (
                        <>
                          <ComboboxField
                            control={form.control}
                            name="farmId"
                            label="Farm"
                            placeholder="Search farms…"
                            options={farmOptions}
                          />
                          <SelectField
                            control={form.control}
                            name="role"
                            label="Role"
                            options={enumToOptions(Object.values(SUBJECT_ROLE))}
                          />
                        </>
                      )}
                    />
                  ),
                },
              ]}
            />
          ))}
          data={rows}
          total={total}
          isLoading={searchQuery.isLoading}
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
