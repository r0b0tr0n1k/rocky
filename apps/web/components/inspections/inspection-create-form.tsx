"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { createInspectionRequestSchema, type FarmResponse, type UserSummary } from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ComboboxField, DateField, SwitchField, TextareaField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function InspectionCreateForm() {
  const router = useRouter();
  const form = useValidatedForm(createInspectionRequestSchema, {
    defaultValues: { selectedByRiskAnalysis: false },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));
  const create = useMutation(
    trpc.inspection.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.inspection.list.queryKey() });
        notifySuccess("Inspection created");
        router.push("/inspections");
      },
      onError: (error) => notifyError(error, "Failed to create inspection"),
    }),
  );

  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const inspectorOptions = ((users.data ?? []) as UserSummary[]).map((u) => ({
    value: u.id,
    label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username,
  }));

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <ComboboxField
          control={form.control}
          name="farmId"
          label="Farm"
          placeholder="Search farms…"
          options={farmOptions}
        />
        <ComboboxField
          control={form.control}
          name="inspectorId"
          label="Inspector"
          placeholder="Search inspectors…"
          options={inspectorOptions}
        />
        <TextField control={form.control} name="riskScore" label="Risk score" placeholder="e.g. HIGH" />
        <TextField control={form.control} name="riskCriteria" label="Risk criteria" placeholder="Optional" />
        <DateField control={form.control} name="scheduledDate" label="Scheduled date" />
        <SwitchField control={form.control} name="selectedByRiskAnalysis" label="Selected by risk analysis" />
        <TextareaField control={form.control} name="notes" label="Notes" placeholder="Optional" />
      </FieldGroup>
    </ValidatedForm>
  );
}
