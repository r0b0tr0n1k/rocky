"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";

import { Button } from "@rocky/ui/components/button";
import {
  createVsAssignmentRequestSchema,
  type FarmSummary,
  type VsAssignmentResponse,
} from "@rocky/validators/api";
import { ActionDialog } from "#components/shared/action-dialog";
import {
  ComboboxField,
  DateField,
  SwitchField,
  TextareaField,
  TextField,
} from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { DataTable } from "#components/shared/data-table";
import { vsAssignmentColumns } from "#components/vs-assignments/columns";
import { useTRPC } from "#lib/trpc";

// Form shape mirrors the tRPC input { id, data: { endDate?, notes? } }.
// updateVsAssignmentRequestSchema carries a server-side .refine (>=1 field);
// the server remains the source of truth for that rule, so the form uses a
// plain mirror to keep the Zod nesting type-clean.
const unassignFormSchema = z.strictObject({
  id: z.uuid(),
  data: z.strictObject({
    endDate: z.coerce.date<string>().optional(),
    notes: z.string().optional(),
  }),
});

export default function VsAssignmentsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = React.useState<string | undefined>(undefined);

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100, offset: 0 }));
  const farmOptions = ((farms.data?.data ?? []) as FarmSummary[]).map((f) => ({
    value: f.id,
    label: f.name ?? f.farmId,
  }));

  const listQuery = useQuery(
    trpc.vsAssignment.getByFarm.queryOptions({ farmId: farmId ?? "" }, { enabled: !!farmId }),
  );
  const rows = (listQuery.data ?? []) as VsAssignmentResponse[];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.vsAssignment.getByFarm.queryKey({ farmId: farmId ?? "" }),
    });

  const assign = useMutation(trpc.vsAssignment.assign.mutationOptions({ onSuccess: invalidate }));
  const unassign = useMutation(
    trpc.vsAssignment.unassign.mutationOptions({ onSuccess: invalidate }),
  );

  const columns = React.useMemo(
    () =>
      vsAssignmentColumns({
        renderUnassign: (row) => (
          <ActionDialog
            as="menuitem"
            triggerLabel="Unassign"
            schema={unassignFormSchema}
            mutation={unassign}
            defaultValues={{ id: row.id, data: {} }}
            title="Unassign farm"
            description="Ends this veterinary-service assignment for the farm."
            fields={(form) => (
              <>
                <DateField control={form.control} name="data.endDate" label="End date" />
                <TextareaField control={form.control} name="data.notes" label="Notes" />
              </>
            )}
          />
        ),
      }),
    [unassign],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="VS Assignments"
        description="Which farms are covered by which veterinary-service contracts."
        actions={
          <ActionDialog
            as="button"
            triggerLabel="Assign farm"
            icon={Plus}
            schema={createVsAssignmentRequestSchema}
            mutation={assign}
            title="Assign farm to contract"
            description="Links a farm to a veterinary-service contract."
            fields={(form) => (
              <>
                <TextField
                  control={form.control}
                  name="contractId"
                  label="Contract ID (UUID)"
                  placeholder="vs contract uuid"
                />
                <ComboboxField
                  control={form.control}
                  name="farmId"
                  label="Farm"
                  options={farmOptions}
                  placeholder="Select a farm"
                />
                <DateField control={form.control} name="startDate" label="Start date" />
                <DateField control={form.control} name="endDate" label="End date (optional)" />
                <SwitchField control={form.control} name="isPrimary" label="Primary assignment" />
                <TextareaField control={form.control} name="notes" label="Notes" />
              </>
            )}
          />
        }
      />

      <Select value={farmId ?? "all"} onValueChange={(v) => setFarmId(v === "all" ? undefined : v)}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a farm…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All farms</SelectItem>
          {farmOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DataTable
        columns={columns}
        data={rows}
        total={rows.length}
        isLoading={listQuery.isLoading}
        page={0}
        pageSize={Math.max(rows.length, 20)}
        onPageChange={() => {}}
      />
    </div>
  );
}
