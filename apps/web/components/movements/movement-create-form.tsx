"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { type AnimalSummary, createMovementRequestSchema, type FarmResponse } from "@rocky/validators/api";

import { DEATH_CAUSE, MOVEMENT_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ComboboxField,
  DateField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function MovementCreateForm() {
  const router = useRouter();
  const form = useValidatedForm(createMovementRequestSchema, {
    defaultValues: { isVerified: false, isActive: true },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const create = useMutation(
    trpc.movement.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.movement.list.queryKey() });
        notifySuccess("Movement created");
        router.push("/movements");
      },
      onError: (error) => notifyError(error, "Failed to create movement"),
    }),
  );

  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: `${a.stateCode}${a.earTagNumber}`,
  }));

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <ComboboxField
          control={form.control}
          name="animalId"
          label="Animal"
          placeholder="Search animals…"
          options={animalOptions}
        />
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          placeholder="Select type"
          options={enumToOptions(Object.values(MOVEMENT_TYPE))}
        />
        <ComboboxField
          control={form.control}
          name="fromFarmId"
          label="From farm"
          placeholder="Search farms…"
          options={farmOptions}
        />
        <ComboboxField
          control={form.control}
          name="toFarmId"
          label="To farm"
          placeholder="Search farms…"
          options={farmOptions}
        />
        <DateField control={form.control} name="movementDate" label="Movement date" />
        <DateField control={form.control} name="arrivalDate" label="Arrival date" />
        <DateField control={form.control} name="deathDate" label="Death date" />
        <SelectField
          control={form.control}
          name="deathCause"
          label="Death cause"
          placeholder="Select cause"
          options={enumToOptions(Object.values(DEATH_CAUSE))}
        />
        <TextField control={form.control} name="documentRef" label="Document ref" placeholder="Optional" />
        <TextareaField control={form.control} name="reason" label="Reason" placeholder="Optional" />
        <SwitchField control={form.control} name="isVerified" label="Verified" />
        <SwitchField control={form.control} name="isActive" label="Active" />
      </FieldGroup>
    </ValidatedForm>
  );
}
