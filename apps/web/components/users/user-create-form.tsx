"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LANGUAGE, USER_STATUS } from "@rocky/validators/enums";
import { createUserRequestSchema } from "@rocky/validators/api";
import { SelectField, SwitchField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { FieldGroup } from "@rocky/ui/components/field";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function UserCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useValidatedForm(createUserRequestSchema, {
    defaultValues: { language: "MK", status: USER_STATUS.ACTIVE },
  });

  const create = useMutation(
    trpc.user.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() });
        notifySuccess("User created");
        router.push("/users");
      },
      onError: (error) => notifyError(error, "Failed to create user"),
    }),
  );

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <FieldGroup>
        <TextField control={form.control} name="username" label="Username" placeholder="jdoe" />
        <TextField control={form.control} name="email" label="Email" placeholder="jdoe@example.com" />
        <TextField control={form.control} name="mobilePhone" label="Mobile phone" placeholder="+389..." />
        <SelectField control={form.control} name="language" label="Language" options={enumToOptions(Object.values(LANGUAGE))} />
        <SelectField control={form.control} name="status" label="Status" options={enumToOptions(Object.values(USER_STATUS))} />
        <TextField control={form.control} name="password" label="Password" type="password" placeholder="Min. 8 characters" />
      </FieldGroup>
</ValidatedForm>
  );
}
