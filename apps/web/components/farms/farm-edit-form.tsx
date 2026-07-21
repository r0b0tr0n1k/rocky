"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { type FarmSummary, updateFarmRequestSchema } from "@rocky/validators/api";
import { DATA_SOURCE, FARM_TYPE, VERIFICATION_STATUS } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ComboboxField, SelectField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function FarmEditForm({ id }: { id: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.farm.getById.queryOptions({ id }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const update = useMutation(
    trpc.farm.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.farm.list.queryKey() });
        notifySuccess("Farm updated");
        router.push("/farms");
      },
      onError: (error) => notifyError(error, "Failed to update farm"),
    }),
  );

  const farm = getQuery.data;

  const form = useValidatedForm(updateFarmRequestSchema, {
    defaultValues: farm
      ? {
          name: farm.name ?? undefined,
          type: farm.type,
          dataSource: farm.dataSource,
          verificationStatus: farm.verificationStatus,
          parentFarmId: farm.parentFarmId ?? undefined,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!farm) return;
    form.reset({
      name: farm.name ?? undefined,
      type: farm.type,
      dataSource: farm.dataSource,
      verificationStatus: farm.verificationStatus,
      parentFarmId: farm.parentFarmId ?? undefined,
    });
  }, [farm, form]);

  const parentOptions = ((farms.data?.data ?? []) as FarmSummary[])
    .filter((f) => f.id !== id)
    .map((f) => ({ value: f.id, label: `${f.farmId} · ${f.name}` }));

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate({ id, ...values })}>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" placeholder="Green Meadow Farm" />
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          options={enumToOptions(Object.values(FARM_TYPE))}
        />
        <SelectField
          control={form.control}
          name="dataSource"
          label="Data source"
          options={enumToOptions(Object.values(DATA_SOURCE))}
        />
        <SelectField
          control={form.control}
          name="verificationStatus"
          label="Verification status"
          options={enumToOptions(Object.values(VERIFICATION_STATUS))}
        />
        <ComboboxField
          control={form.control}
          name="parentFarmId"
          label="Parent farm"
          placeholder="Search farms…"
          options={parentOptions}
        />
      </FieldGroup>
    </ValidatedForm>
  );
}
