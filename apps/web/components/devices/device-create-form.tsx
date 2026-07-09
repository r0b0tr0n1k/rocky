"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPdaDeviceRequestSchema } from "@rocky/validators/api";
import { TextField } from "#components/shared/form-fields";
import { ValidatedForm } from "#components/shared/validated-form";
import { useTRPC } from "#lib/trpc";
import { notifyError, notifySuccess } from "#lib/notify";
import { useValidatedForm } from "#lib/use-validated-form";

export function DeviceCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useValidatedForm(createPdaDeviceRequestSchema, {});

  const create = useMutation(
    trpc.device.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.device.list.queryKey() });
        notifySuccess("Device created");
        router.push("/devices");
      },
      onError: (error) => notifyError(error, "Failed to create device"),
    }),
  );

  return (
    <ValidatedForm form={form} submitting={create.isPending} onValid={(values) => create.mutate(values)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="deviceIdentifier" label="Device identifier" placeholder="iPhone-ABCD1234" />
        <TextField control={form.control} name="deviceType" label="Device type" placeholder="iPhone15,3" />
        <TextField control={form.control} name="name" label="Name" placeholder="Field tablet A" />
        <TextField control={form.control} name="appVersion" label="App version" placeholder="1.4.2" />
        <TextField control={form.control} name="osVersion" label="OS version" placeholder="17.5" />
      </div>
    </ValidatedForm>
  );
}
