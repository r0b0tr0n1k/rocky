"use client";

import { Button } from "@rocky/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rocky/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";
import type { AnimalSummary, FarmResponse } from "@rocky/validators/api";
import { archiveInspectionFormRequestSchema } from "@rocky/validators/api";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { type ArchiveDocumentResponse, archiveColumns } from "#components/archive/columns";
import { ActionDialog } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { SearchInput, TableCard, tableDensityClass } from "#components/shared/table-card";
import { useTRPC } from "#lib/trpc";
import { useDebounced } from "#lib/use-debounced";

export default function ArchivePage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [documentType, setDocumentType] = React.useState<string | undefined>(undefined);
  const [location, setLocation] = React.useState<string | undefined>(undefined);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search);
  const pageSize = 20;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.archive.list.queryKey() });
  const markDestroyed = useMutation(trpc.archive.markDestroyed.mutationOptions({ onSuccess: invalidate }));
  const listQuery = useQuery(
    trpc.archive.list.queryOptions({
      documentType: documentType as (typeof ARCHIVE_DOCUMENT_TYPE)[keyof typeof ARCHIVE_DOCUMENT_TYPE] | undefined,
      archiveLocation: location as (typeof ARCHIVE_LOCATION)[keyof typeof ARCHIVE_LOCATION] | undefined,
      search: debouncedSearch || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
  );
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const inspections = useQuery(trpc.inspection.list.queryOptions({ limit: 100 }));
  const inspectionOptions = ((inspections.data?.data ?? []) as { id: string; referenceNumber?: string }[]).map((i) => ({
    value: i.id,
    label: i.referenceNumber ?? i.id,
  }));
  const listExpiredQ = useQuery(trpc.archive.listExpired.queryOptions({ limit: 100 }));
  const archiveInspectionForm = useMutation(
    trpc.archive.archiveInspectionForm.mutationOptions({
      onSuccess: () => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: trpc.archive.listExpired.queryKey() });
      },
    }),
  );

  const rows = (listQuery.data?.data ?? []) as ArchiveDocumentResponse[];
  const total = listQuery.data?.total ?? 0;

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => {
    farmMap.set(f.id, f);
  });
  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => {
    animalMap.set(a.id, a);
  });

  const farmLabel = (id?: string | null) => {
    if (!id) return "—";
    const f = farmMap.get(id);
    return f ? `${f.farmId} · ${f.name}` : id;
  };
  const animalLabel = (id?: string | null) => {
    if (!id) return "—";
    const a = animalMap.get(id);
    return a ? `${a.stateCode}${a.earTagNumber}` : id;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Archive" description="3-tier document archive (CPC / VS / VI) with retention enforcement." />
      <Tabs defaultValue="documents" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <TableCard
            toolbarLeft={
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Select
                  value={documentType ?? "all"}
                  onValueChange={(v) => {
                    setDocumentType(v === "all" ? undefined : v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(ARCHIVE_DOCUMENT_TYPE).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={location ?? "all"}
                  onValueChange={(v) => {
                    setLocation(v === "all" ? undefined : v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {Object.values(ARCHIVE_LOCATION).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SearchInput value={search} onChange={setSearch} placeholder="Search documents…" />
              </div>
            }
            action={
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => router.push("/archive/new")}>
                  <Plus /> Archive document
                </Button>
                <ActionDialog
                  triggerLabel="Archive inspection form"
                  schema={archiveInspectionFormRequestSchema}
                  mutation={archiveInspectionForm}
                  title="Archive inspection form"
                  description="Archive a completed inspection form."
                  fields={(form) => (
                    <>
                      <ComboboxField
                        control={form.control}
                        name="inspectionId"
                        label="Inspection"
                        placeholder="Search inspections…"
                        options={inspectionOptions}
                      />
                      <ComboboxField
                        control={form.control}
                        name="farmId"
                        label="Farm"
                        placeholder="Search farms…"
                        options={farmOptions}
                      />
                    </>
                  )}
                />
              </div>
            }
          >
            <DataTable
              columns={archiveColumns({ animalLabel, farmLabel, markDestroyed })}
              data={rows}
              total={total}
              isLoading={listQuery.isLoading}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>

        <TabsContent value="expired">
          <TableCard>
            <DataTable
              columns={archiveColumns({ animalLabel, farmLabel, markDestroyed })}
              data={(listExpiredQ.data ?? []) as ArchiveDocumentResponse[]}
              total={(listExpiredQ.data ?? []).length}
              isLoading={listExpiredQ.isLoading}
              page={0}
              pageSize={pageSize}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
