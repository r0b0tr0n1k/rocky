"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { createOrganizationRequestSchema, type OrganizationSummary } from "@rocky/validators/api";
import { ORG_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ComboboxField, SelectField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function OrganizationCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useValidatedForm(createOrganizationRequestSchema, {});

  const orgs = useQuery(trpc.organization.list.queryOptions());
  const parentOptions = ((orgs.data ?? []) as OrganizationSummary[]).map((o) => ({
    value: o.id,
    label: o.name1,
  }));

  const create = useMutation(
    trpc.organization.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.organization.list.queryKey() });
        notifySuccess("Organization created");
        router.push("/organizations");
      },
      onError: (error) => notifyError(error, "Failed to create organization"),
    }),
  );

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <TextField control={form.control} name="name1" label="Name (line 1)" placeholder="Veterinary Directorate" />
        <SelectField
          control={form.control}
          name="orgType"
          label="Type"
          options={enumToOptions(Object.values(ORG_TYPE))}
        />
        <TextField control={form.control} name="name2" label="Name (line 2)" />
        <TextField control={form.control} name="name3" label="Name (line 3)" />
        <TextField control={form.control} name="phone" label="Phone" placeholder="+389..." />
        <TextField control={form.control} name="email" label="Email" placeholder="contact@example.com" />
        <ComboboxField
          control={form.control}
          name="parentId"
          label="Parent organization"
          placeholder="Search…"
          options={parentOptions}
        />
      </FieldGroup>
    </ValidatedForm>
  );
}
