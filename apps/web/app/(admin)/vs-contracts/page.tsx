"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rocky/ui/components/dialog";
import { Input } from "@rocky/ui/components/input";
import {
  createVsContractRequestSchema,
  updateVsContractStatusRequestSchema,
  type VsContractResponse,
} from "@rocky/validators/api";
import { VS_CONTRACT_STATUS, type vsContractStatusType } from "@rocky/validators/enums";
import { ActionDialog } from "#components/shared/action-dialog";
import { DateField, SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { Stepper } from "#components/shared/stepper";
import { DataTable } from "#components/shared/data-table";
import { vsContractColumns } from "#components/vs-contracts/columns";
import { useTRPC } from "#lib/trpc";

// Imported enum — drives both the lifecycle Stepper and the status <select>.
// NEVER inline this array; the Single Source of Truth is @rocky/validators/enums.
const VS_STATUS_ORDER = Object.values(VS_CONTRACT_STATUS);

function statusStep(
  s: vsContractStatusType,
  current: vsContractStatusType,
): "done" | "current" | "upcoming" {
  const curIdx = VS_STATUS_ORDER.indexOf(current);
  const idx = VS_STATUS_ORDER.indexOf(s);
  if (s === current) return "current";
  return idx < curIdx ? "done" : "upcoming";
}

// Full tRPC input shape ({ id, data: { status } }) so the ActionDialog can
// submit directly to updateStatus.mutate without a hand-rolled wrapper.
const updateStatusFormSchema = z.strictObject({
  id: z.uuid(),
  data: updateVsContractStatusRequestSchema,
});

export default function VsContractsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [region, setRegion] = React.useState("");
  const [selected, setSelected] = React.useState<VsContractResponse | null>(null);

  const listQuery = useQuery(
    trpc.vsContract.getByRegion.queryOptions({ region }, { enabled: region.length > 0 }),
  );
  const rows = (listQuery.data ?? []) as VsContractResponse[];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.vsContract.getByRegion.queryKey({ region }),
    });

  const create = useMutation(trpc.vsContract.create.mutationOptions({ onSuccess: invalidate }));
  const updateStatus = useMutation(
    trpc.vsContract.updateStatus.mutationOptions({ onSuccess: invalidate }),
  );

  const columns = React.useMemo(() => vsContractColumns({ onView: setSelected }), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="VS Contracts"
        description="Veterinary service contracts and their lifecycle."
        actions={
          <ActionDialog
            as="button"
            triggerLabel="New contract"
            icon={Plus}
            schema={createVsContractRequestSchema}
            mutation={create}
            title="New VS contract"
            description="Creates a veterinary service contract for a subject."
            fields={(form) => (
              <>
                <TextField
                  control={form.control}
                  name="subjectId"
                  label="Subject ID (UUID)"
                  placeholder="uuid"
                />
                <TextField
                  control={form.control}
                  name="contractNumber"
                  label="Contract number"
                  placeholder="VS-2026-001"
                />
                <TextField control={form.control} name="region" label="Region" placeholder="north" />
                <DateField control={form.control} name="startDate" label="Start date" />
                <DateField control={form.control} name="endDate" label="End date (optional)" />
                <TextareaField control={form.control} name="notes" label="Notes" />
              </>
            )}
          />
        }
      />

      <Input
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="Filter by region…"
        className="max-w-xs"
      />

      <DataTable
        columns={columns}
        data={rows}
        total={rows.length}
        isLoading={listQuery.isLoading}
        page={0}
        pageSize={Math.max(rows.length, 20)}
        onPageChange={() => {}}
      />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected ? (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.contractNumber}</DialogTitle>
              <DialogDescription>Region: {selected.region}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="capitalize">{selected.status}</Badge>
            </div>

            <Stepper
              steps={VS_STATUS_ORDER.map((s) => ({
                label: s,
                status: statusStep(s, selected.status),
              }))}
              orientation="horizontal"
            />

            <div className="flex justify-end">
              <ActionDialog
                key={selected.id}
                as="button"
                triggerLabel="Update status"
                schema={updateStatusFormSchema}
                mutation={updateStatus}
                defaultValues={{ id: selected.id, data: { status: selected.status } }}
                title="Update contract status"
                description="Transitions the contract to a new lifecycle state."
                fields={(form) => (
                  <SelectField
                    control={form.control}
                    name="data.status"
                    label="Status"
                    options={VS_STATUS_ORDER.map((s) => ({ label: s, value: s }))}
                  />
                )}
              />
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
