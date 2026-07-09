"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ANIMAL_STATUS, BIRTH_TYPE, SEX, STATE_CODE } from "@rocky/validators/enums";
import { createAnimalRequestSchema, type FarmResponse, type AnimalSummary } from "@rocky/validators/api";
import { ComboboxField, DateField, NumberField, SelectField, SwitchField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { FieldGroup } from "@rocky/ui/components/field";
import { enumToOptions } from "#lib/options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function AnimalCreateForm() {
  const router = useRouter();
  const form = useValidatedForm(createAnimalRequestSchema, {
    defaultValues: { stateCode: STATE_CODE.MK, isFirstTagging: false, imported: false },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const create = useMutation(trpc.animal.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.animal.list.queryKey() });
      notifySuccess("Animal created");
      router.push("/animals");
    },
    onError: (error) => notifyError(error, "Failed to create animal"),
  }));

  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const motherOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: `${a.stateCode}${a.earTagNumber}`,
  }));

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <SelectField control={form.control} name="stateCode" label="State code" options={enumToOptions(Object.values(STATE_CODE))} />
        <TextField control={form.control} name="earTagNumber" label="Ear tag number" placeholder="12345678" description="8-digit ear tag." />
        <DateField control={form.control} name="birthDate" label="Birth date" />
        <SelectField control={form.control} name="sex" label="Sex" options={enumToOptions(Object.values(SEX))} />
        <TextField control={form.control} name="breed" label="Breed" placeholder="Limousine" />
        <SelectField control={form.control} name="birthType" label="Birth type" options={enumToOptions(Object.values(BIRTH_TYPE))} />
        <NumberField control={form.control} name="birthWeight" label="Birth weight (g)" placeholder="40000" />
        <ComboboxField control={form.control} name="currentFarmId" label="Current farm" placeholder="Search farms…" options={farmOptions} />
        <ComboboxField control={form.control} name="motherId" label="Mother" placeholder="Search animals…" options={motherOptions} />
        <SelectField control={form.control} name="status" label="Status" options={enumToOptions(Object.values(ANIMAL_STATUS))} />
        <DateField control={form.control} name="taggingDate" label="Tagging date" />
        <SwitchField control={form.control} name="isFirstTagging" label="First tagging campaign" />
        <SwitchField control={form.control} name="imported" label="Imported" />
      </FieldGroup>
</ValidatedForm>
  );
}
