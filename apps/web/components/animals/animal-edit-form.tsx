"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ANIMAL_STATUS, BIRTH_TYPE } from "@rocky/validators/enums";
import { updateAnimalRequestSchema, type FarmResponse, type AnimalSummary } from "@rocky/validators/api";
import { ComboboxField, DateField, NumberField, SelectField, SwitchField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { enumToOptions } from "#lib/options";
import { trpc } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function AnimalEditForm({ id }: { id: string }) {
  const router = useRouter();
  const getQuery = trpc.animal.getById.useQuery({ id });
  const farms = trpc.farm.list.useQuery({ limit: 100 });
  const animals = trpc.animal.list.useQuery({ limit: 100 });
  const update = trpc.animal.update.useMutation({
    onSuccess: () => router.push("/animals"),
  });

  const animal = getQuery.data;

  const form = useValidatedForm(updateAnimalRequestSchema, {
    defaultValues: animal
      ? {
          breed: animal.breed ?? undefined,
          birthType: animal.birthType ?? undefined,
          birthWeight: animal.birthWeight ?? undefined,
          status: animal.status,
          currentFarmId: animal.currentFarmId,
          motherId: animal.motherId ?? undefined,
          taggingDate: animal.taggingDate ? new Date(animal.taggingDate).toISOString() : undefined,
          isFirstTagging: animal.isFirstTagging,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!animal) return;
    form.reset({
      breed: animal.breed ?? undefined,
      birthType: animal.birthType ?? undefined,
      birthWeight: animal.birthWeight ?? undefined,
      status: animal.status,
      currentFarmId: animal.currentFarmId,
      motherId: animal.motherId ?? undefined,
      taggingDate: animal.taggingDate ? new Date(animal.taggingDate).toISOString() : undefined,
      isFirstTagging: animal.isFirstTagging,
    });
  }, [animal, form]);

  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const motherOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: `${a.stateCode}${a.earTagNumber}`,
  }));

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate(values)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="breed" label="Breed" placeholder="Limousine" />
        <SelectField control={form.control} name="birthType" label="Birth type" options={enumToOptions(Object.values(BIRTH_TYPE))} />
        <NumberField control={form.control} name="birthWeight" label="Birth weight (g)" placeholder="40000" />
        <SelectField control={form.control} name="status" label="Status" options={enumToOptions(Object.values(ANIMAL_STATUS))} />
        <ComboboxField control={form.control} name="currentFarmId" label="Current farm" placeholder="Search farms…" options={farmOptions} />
        <ComboboxField control={form.control} name="motherId" label="Mother" placeholder="Search animals…" options={motherOptions} />
        <DateField control={form.control} name="taggingDate" label="Tagging date" />
        <SwitchField control={form.control} name="isFirstTagging" label="First tagging campaign" />
      </div>
    </ValidatedForm>
  );
}
