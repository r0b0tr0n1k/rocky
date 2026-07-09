"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { updatePdaDeviceRequestSchema, type UserSummary } from "@rocky/validators/api";
import { ComboboxField, TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { FieldGroup } from "@rocky/ui/components/field";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function DeviceEditForm({ id }: { id: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.device.getById.queryOptions({ id }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));
  const update = useMutation(
    trpc.device.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.device.list.queryKey() });
        notifySuccess("Device updated");
        router.push("/devices");
      },
      onError: (error) => notifyError(error, "Failed to update device"),
    }),
  );

  const device = getQuery.data;

  const userOptions = ((users.data ?? []) as UserSummary[]).map((u) => ({
    value: u.id,
    label: u.username,
  }));

  const form = useValidatedForm(updatePdaDeviceRequestSchema, {
    defaultValues: device
      ? {
          name: device.name ?? undefined,
          appVersion: device.appVersion ?? undefined,
          osVersion: device.osVersion ?? undefined,
          currentUserId: device.currentUserId ?? undefined,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (!device) return;
    form.reset({
      name: device.name ?? undefined,
      appVersion: device.appVersion ?? undefined,
      osVersion: device.osVersion ?? undefined,
      currentUserId: device.currentUserId ?? undefined,
    });
  }, [device, form]);

  return (
    <ValidatedForm form={form} submitting={update.isPending} onValid={(values) => update.mutate(values)}>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" placeholder="Field tablet A" />
        <TextField control={form.control} name="appVersion" label="App version" placeholder="1.4.2" />
        <TextField control={form.control} name="osVersion" label="OS version" placeholder="17.5" />
        <ComboboxField control={form.control} name="currentUserId" label="Assigned user" placeholder="Search users…" options={userOptions} />
      </FieldGroup>
</ValidatedForm>
  );
}
