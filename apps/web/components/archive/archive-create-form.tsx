"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import {
  type AnimalSummary,
  createArchiveDocumentRequestSchema,
  type FarmResponse,
  type InspectionResponse,
  type PassportResponse,
} from "@rocky/validators/api";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ComboboxField, DateField, SelectField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function ArchiveCreateForm() {
  const router = useRouter();
  const form = useValidatedForm(createArchiveDocumentRequestSchema, {
    defaultValues: { archiveLocation: ARCHIVE_LOCATION.CPC },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const passports = useQuery(trpc.passport.list.queryOptions({ limit: 100 }));
  const inspections = useQuery(trpc.inspection.list.queryOptions({ limit: 100 }));
  const create = useMutation(
    trpc.archive.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.archive.list.queryKey() });
        notifySuccess("Archive entry created");
        router.push("/archive");
      },
      onError: (error) => notifyError(error, "Failed to create archive entry"),
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
  const passportOptions = ((passports.data?.data ?? []) as PassportResponse[]).map((p) => ({
    value: p.id,
    label: p.passportNumber,
  }));
  const inspectionOptions = ((inspections.data?.data ?? []) as InspectionResponse[]).map((i) => ({
    value: i.id,
    label: `Inspection ${i.id.slice(0, 8)}`,
  }));

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <SelectField
          control={form.control}
          name="documentType"
          label="Document type"
          options={enumToOptions(Object.values(ARCHIVE_DOCUMENT_TYPE))}
        />
        <TextField control={form.control} name="documentRef" label="Document ref" placeholder="Optional" />
        <SelectField
          control={form.control}
          name="archiveLocation"
          label="Archive location"
          options={enumToOptions(Object.values(ARCHIVE_LOCATION))}
        />
        <TextField control={form.control} name="physicalLocation" label="Physical location" placeholder="Optional" />
        <ComboboxField
          control={form.control}
          name="animalId"
          label="Animal"
          placeholder="Search animals…"
          options={animalOptions}
        />
        <ComboboxField
          control={form.control}
          name="farmId"
          label="Farm"
          placeholder="Search farms…"
          options={farmOptions}
        />
        <ComboboxField
          control={form.control}
          name="passportId"
          label="Passport"
          placeholder="Search passports…"
          options={passportOptions}
        />
        <ComboboxField
          control={form.control}
          name="inspectionId"
          label="Inspection"
          placeholder="Search inspections…"
          options={inspectionOptions}
        />
        <DateField control={form.control} name="retentionExpiry" label="Retention expiry" />
      </FieldGroup>
    </ValidatedForm>
  );
}
