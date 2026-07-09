"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";
import { issuePassportRequestSchema, type AnimalSummary, type FarmSummary, type PassportSummary } from "@rocky/validators/api";
import { PASSPORT_STATUS, type passportStatusType } from "@rocky/validators/enums";
import { passportColumns } from "#components/passports/columns";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import { ActionDialog } from "#components/shared/action-dialog";
import { ComboboxField } from "#components/shared/form-fields";
import { useTRPC } from "#lib/trpc";

export default function PassportsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<passportStatusType | undefined>(undefined);
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  const listQuery = useQuery(
    trpc.passport.list.queryOptions({ status, limit: pageSize, offset: page * pageSize }),
  );
  const rows = (listQuery.data?.data ?? []) as PassportSummary[];
  const total = listQuery.data?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.passport.list.queryKey() });
  const seize = useMutation(trpc.passport.seize.mutationOptions({ onSuccess: invalidate }));
  const reprint = useMutation(trpc.passport.reprint.mutationOptions({ onSuccess: invalidate }));
  const issue = useMutation(trpc.passport.issueForAnimal.mutationOptions({ onSuccess: invalidate }));

  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100, offset: 0 }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100, offset: 0 }));
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: a.earTagNumber,
  }));
  const farmOptions = ((farms.data?.data ?? []) as FarmSummary[]).map((f) => ({
    value: f.id,
    label: f.name ?? f.farmId,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Passports"
        description="Cattle passport lifecycle: issue, seize, reprint."
        actions={
          <ActionDialog
            as="button"
            triggerLabel="Issue passport"
            icon={Plus}
            schema={issuePassportRequestSchema}
            mutation={issue}
            title="Issue passport"
            description="Issues a new cattle passport for an animal on a farm."
            fields={(form) => (
              <>
                <ComboboxField control={form.control} name="animalId" label="Animal" options={animalOptions} />
                <ComboboxField control={form.control} name="farmId" label="Farm" options={farmOptions} />
              </>
            )}
          />
        }
      />
      <Select
        value={status ?? "all"}
        onValueChange={(v) => {
          setStatus(v === "all" ? undefined : (v as passportStatusType));
          setPage(0);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.values(PASSPORT_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DataTable
        columns={passportColumns({ seize, reprint })}
        data={rows}
        total={total}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
