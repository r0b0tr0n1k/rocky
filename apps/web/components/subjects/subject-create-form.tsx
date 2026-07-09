"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSubjectRequestSchema } from "@rocky/validators/api";
import { TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { FieldGroup } from "@rocky/ui/components/field";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function SubjectCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useValidatedForm(createSubjectRequestSchema, {});

  const create = useMutation(
    trpc.subject.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.subject.search.queryKey() });
        notifySuccess("Subject created");
        router.push("/subjects");
      },
      onError: (error) => notifyError(error, "Failed to create subject"),
    }),
  );

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <TextField control={form.control} name="shortName" label="Short name" placeholder="Green Meadow Farm" />
        <TextField control={form.control} name="personalId" label="Personal ID" placeholder="1234567" />
        <TextField control={form.control} name="phoneNumber" label="Phone" placeholder="+389..." />
        <TextField control={form.control} name="email" label="Email" placeholder="name@example.com" />
      </FieldGroup>
</ValidatedForm>
  );
}
