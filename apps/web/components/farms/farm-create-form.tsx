"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DATA_SOURCE, FARM_TYPE, VERIFICATION_STATUS } from "@rocky/validators/enums";
import { createFarmRequestSchema, type FarmSummary } from "@rocky/validators/api";
import {
  ComboboxField,
  SelectField,
  SwitchField,
  TextField,
} from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function FarmCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useValidatedForm(createFarmRequestSchema, {
    defaultValues: { dataSource: DATA_SOURCE.AIMCS, isActive: true },
  });

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const parentOptions = ((farms.data?.data ?? []) as FarmSummary[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));

  const create = useMutation(
    trpc.farm.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.farm.list.queryKey() });
        notifySuccess("Farm created");
        router.push("/farms");
      },
      onError: (error) => notifyError(error, "Failed to create farm"),
    }),
  );

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="farmId" label="Farm ID" placeholder="MK0001234" description="9-character farm identifier." />
        <TextField control={form.control} name="name" label="Name" placeholder="Green Meadow Farm" />
        <SelectField control={form.control} name="type" label="Type" options={enumToOptions(Object.values(FARM_TYPE))} />
        <SelectField control={form.control} name="dataSource" label="Data source" options={enumToOptions(Object.values(DATA_SOURCE))} />
        <ComboboxField control={form.control} name="parentFarmId" label="Parent farm" placeholder="Search farms…" options={parentOptions} />
        <SelectField control={form.control} name="verificationStatus" label="Verification status" options={enumToOptions(Object.values(VERIFICATION_STATUS))} />
        <SwitchField control={form.control} name="isActive" label="Active" />
      </div>
    </ValidatedForm>
  );
}
