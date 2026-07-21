"use client";

import { FieldGroup } from "@rocky/ui/components/field";
import { type UpdateUserRequest, updateUserRequestSchema } from "@rocky/validators/api";
import { LANGUAGE, USER_STATUS } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SelectField, SwitchField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { useValidatedForm } from "#lib/use-validated-form";

export function UserEditForm({ id }: { id: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.user.getById.queryOptions({ id }));
  const update = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() });
        notifySuccess("User updated");
        router.push("/users");
      },
      onError: (error) => notifyError(error, "Failed to update user"),
    }),
  );

  const user = getQuery.data;

  const form = useValidatedForm(updateUserRequestSchema, {
    defaultValues: user
      ? {
          email: user.email ?? undefined,
          mobilePhone: user.mobilePhone ?? undefined,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          language: (user.language ?? undefined) as UpdateUserRequest["language"],
          geoUnlimited: user.geoUnlimited ?? undefined,
          status: user.status,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!user) return;
    form.reset({
      email: user.email ?? undefined,
      mobilePhone: user.mobilePhone ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      language: (user.language ?? undefined) as UpdateUserRequest["language"],
      geoUnlimited: user.geoUnlimited ?? undefined,
      status: user.status,
    });
  }, [user, form]);

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate({ id, ...values })}>
      <FieldGroup>
        <TextField control={form.control} name="firstName" label="First name" />
        <TextField control={form.control} name="lastName" label="Last name" />
        <TextField control={form.control} name="email" label="Email" placeholder="name@example.com" />
        <TextField control={form.control} name="mobilePhone" label="Mobile phone" placeholder="+389..." />
        <SelectField
          control={form.control}
          name="language"
          label="Language"
          options={enumToOptions(Object.values(LANGUAGE))}
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={enumToOptions(Object.values(USER_STATUS))}
        />
        <SwitchField control={form.control} name="geoUnlimited" label="Geo-unlimited" />
      </FieldGroup>
    </ValidatedForm>
  );
}
