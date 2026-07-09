"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rocky/ui/components/select";
import {
  createCorrectionRequestSchema,
  escalateCorrectionRequestSchema,
  resolveCorrectionRequestSchema,
  reviewCorrectionRequestSchema,
  type AnimalSummary,
  type CorrectionResponse,
  type FarmSummary,
} from "@rocky/validators/api";
import { CORRECTION_STATUS, CORRECTION_CASE_TYPE, DETECTION_SOURCE, type correctionStatusType, type detectionSourceType } from "@rocky/validators/enums";
import { enumToOptions } from "#lib/options";
import { correctionColumns } from "#components/corrections/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { Card, CardContent } from "@rocky/ui/components/card";
import { ActionDialog } from "#components/shared/action-dialog";
import { ComboboxField, SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { useTRPC } from "#lib/trpc";

export default function CorrectionsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<correctionStatusType | undefined>(undefined);
  const [source, setSource] = React.useState<detectionSourceType | undefined>(undefined);
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  const listQuery = useQuery(trpc.correction.list.queryOptions({ status, detectionSource: source, limit: pageSize, offset: page * pageSize }));
  const rows = (listQuery.data?.data ?? []) as CorrectionResponse[];
  const total = listQuery.data?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.correction.list.queryKey() });
  const create = useMutation(trpc.correction.create.mutationOptions({ onSuccess: invalidate }));
  const review = useMutation(trpc.correction.review.mutationOptions({ onSuccess: invalidate }));
  const resolve = useMutation(trpc.correction.resolve.mutationOptions({ onSuccess: invalidate }));
  const escalate = useMutation(trpc.correction.escalate.mutationOptions({ onSuccess: invalidate }));

  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100, offset: 0 }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100, offset: 0 }));
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({ value: a.id, label: a.earTagNumber }));
  const farmOptions = ((farms.data?.data ?? []) as FarmSummary[]).map((f) => ({ value: f.id, label: f.name ?? f.farmId }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Corrections"
        description="Error-correction cases: review, resolve, escalate."
        actions={
          <ActionDialog
            as="button"
            triggerLabel="New correction"
            icon={Plus}
            schema={createCorrectionRequestSchema}
            mutation={create}
            title="New correction"
            description="Log a data error for a-priori or a-posteriori correction."
            fields={(form) => (
              <>
                <SelectField control={form.control} name="detectionSource" label="Detection source" options={enumToOptions(Object.values(DETECTION_SOURCE))} />
                <TextField control={form.control} name="errorType" label="Error type" placeholder="e.g. WRONG_BREED" />
                <TextareaField control={form.control} name="errorDescription" label="Error description" />
                <ComboboxField control={form.control} name="farmId" label="Farm" options={farmOptions} />
                <ComboboxField control={form.control} name="animalId" label="Animal" options={animalOptions} />
                <SelectField control={form.control} name="caseType" label="Case type" options={enumToOptions(Object.values(CORRECTION_CASE_TYPE))} />
              </>
            )}
          />
        }
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Select value={status ?? "all"} onValueChange={(v) => { setStatus(v === "all" ? undefined : (v as correctionStatusType)); setPage(0); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(CORRECTION_STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source ?? "all"} onValueChange={(v) => { setSource(v === "all" ? undefined : (v as detectionSourceType)); setPage(0); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {Object.values(DETECTION_SOURCE).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={correctionColumns({ review, resolve, escalate })}
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
