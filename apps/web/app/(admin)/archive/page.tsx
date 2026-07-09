"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@rocky/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";
import { archiveColumns, type ArchiveDocumentResponse } from "#components/archive/columns";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/validators/enums";
import type { AnimalSummary, FarmResponse } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";

export default function ArchivePage() {
  const router = useRouter();
  const [page, setPage] = React.useState(0);
  const [documentType, setDocumentType] = React.useState<string | undefined>(undefined);
  const [location, setLocation] = React.useState<string | undefined>(undefined);
  const pageSize = 20;

  const trpc = useTRPC();
  const listQuery = useQuery(trpc.archive.list.queryOptions({
    documentType: documentType as (typeof ARCHIVE_DOCUMENT_TYPE)[keyof typeof ARCHIVE_DOCUMENT_TYPE] | undefined,
    archiveLocation: location as (typeof ARCHIVE_LOCATION)[keyof typeof ARCHIVE_LOCATION] | undefined,
    limit: pageSize,
    offset: page * pageSize,
  }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));

  const rows = (listQuery.data?.data ?? []) as ArchiveDocumentResponse[];
  const total = listQuery.data?.total ?? 0;

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => farmMap.set(f.id, f));
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => animalMap.set(a.id, a));

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
      <PageHeader
        title="Archive"
        description="3-tier document archive (CPC / VS / VI) with retention enforcement."
        actions={
          <Button onClick={() => router.push("/archive/new")}>
            <Plus /> Archive document
          </Button>
        }
      />
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
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={archiveColumns({ animalLabel, farmLabel })}
            data={rows}
            total={total}
            isLoading={listQuery.isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            bordered={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
