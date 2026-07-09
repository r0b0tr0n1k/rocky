"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { updateSubjectRequestSchema } from "@rocky/validators/api";
import { TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function SubjectEditForm({ id }: { id: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.subject.getById.queryOptions({ id }));
  const update = useMutation(
    trpc.subject.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.subject.search.queryKey() });
        notifySuccess("Subject updated");
        router.push("/subjects");
      },
      onError: (error) => notifyError(error, "Failed to update subject"),
    }),
  );

  const subject = getQuery.data;

  const form = useValidatedForm(updateSubjectRequestSchema, {
    defaultValues: subject
      ? {
          shortName: subject.shortName ?? undefined,
          firstName: subject.firstName ?? undefined,
          lastName: subject.lastName ?? undefined,
          companyName: subject.companyName ?? undefined,
          personalId: subject.personalId ?? undefined,
          vatNumber: subject.vatNumber ?? undefined,
          phoneNumber: subject.phoneNumber ?? undefined,
          email: subject.email ?? undefined,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!subject) return;
    form.reset({
      shortName: subject.shortName ?? undefined,
      firstName: subject.firstName ?? undefined,
      lastName: subject.lastName ?? undefined,
      companyName: subject.companyName ?? undefined,
      personalId: subject.personalId ?? undefined,
      vatNumber: subject.vatNumber ?? undefined,
      phoneNumber: subject.phoneNumber ?? undefined,
      email: subject.email ?? undefined,
    });
  }, [subject, form]);

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate({ id, data: values })}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="shortName" label="Short name" />
        <TextField control={form.control} name="companyName" label="Company name" />
        <TextField control={form.control} name="firstName" label="First name" />
        <TextField control={form.control} name="lastName" label="Last name" />
        <TextField control={form.control} name="personalId" label="Personal ID" />
        <TextField control={form.control} name="vatNumber" label="VAT number" />
        <TextField control={form.control} name="phoneNumber" label="Phone" />
        <TextField control={form.control} name="email" label="Email" />
      </div>
    </ValidatedForm>
  );
}
