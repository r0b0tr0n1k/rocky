"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { Skeleton } from "@rocky/ui/components/skeleton";
import { updateSubjectRequestSchema } from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function SubjectEditForm({ id }: { id: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const subjectQuery = useQuery(trpc.subject.getById.queryOptions({ id }));
  const form = useValidatedForm(updateSubjectRequestSchema);

  React.useEffect(() => {
    if (subjectQuery.data) {
      form.reset({
        shortName: subjectQuery.data.shortName ?? "",
        personalId: subjectQuery.data.personalId ?? "",
        phoneNumber: subjectQuery.data.phoneNumber ?? "",
        email: subjectQuery.data.email ?? "",
      });
    }
  }, [subjectQuery.data, form]);

  const update = useMutation(
    trpc.subject.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.subject.getById.queryKey({ id }) });
        queryClient.invalidateQueries({ queryKey: trpc.subject.search.queryKey() });
        notifySuccess("Subject updated");
        router.push("/subjects");
      },
      onError: (error) => notifyError(error, "Failed to update subject"),
    }),
  );

  if (subjectQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!subjectQuery.data) {
    return <p className="text-sm text-muted-foreground">Subject not found.</p>;
  }

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate({ id, data: values })}>
      <FieldGroup>
        <TextField control={form.control} name="shortName" label="Short name" placeholder="Green Meadow Farm" />
        <TextField control={form.control} name="personalId" label="Personal ID" placeholder="1234567" />
        <TextField control={form.control} name="phoneNumber" label="Phone" placeholder="+389..." />
        <TextField control={form.control} name="email" label="Email" placeholder="name@example.com" />
      </FieldGroup>
    </ValidatedForm>
  );
}
