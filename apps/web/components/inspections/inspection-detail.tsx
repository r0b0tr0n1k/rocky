"use client";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Skeleton } from "@rocky/ui/components/skeleton";
import {
  completeInspectionRequestSchema,
  type FarmResponse,
  type InspectionResponse,
  printInspectionFormRequestSchema,
  scheduleInspectionRequestSchema,
  type UserSummary,
} from "@rocky/validators/api";
import { LANGUAGE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type * as React from "react";
import { INSPECTION_STATUS_VARIANT } from "#components/inspections/columns";
import { ActionDialog } from "#components/shared/action-dialog";
import { DateField, SelectField, SwitchField, TextareaField, TextField } from "#components/shared/form-fields";
import { StatusBadge } from "#components/shared/status-badge";
import { notifyError, notifySuccess } from "#lib/notify";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

function fmt(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "PP");
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function InspectionDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.inspection.getById.queryOptions({ id }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.inspection.getById.queryKey({ id }) });
  const schedule = useMutation(
    trpc.inspection.schedule.mutationOptions({
      onSuccess: () => {
        invalidate();
        notifySuccess("Inspection scheduled");
      },
      onError: (error) => notifyError(error, "Failed to schedule inspection"),
    }),
  );
  const complete = useMutation(
    trpc.inspection.complete.mutationOptions({
      onSuccess: () => {
        invalidate();
        notifySuccess("Inspection completed");
      },
      onError: (error) => notifyError(error, "Failed to complete inspection"),
    }),
  );
  const printForm = useMutation(
    trpc.inspection.printForm.mutationOptions({
      onSuccess: () => {
        invalidate();
        notifySuccess("Inspection form generated");
      },
      onError: (error) => notifyError(error, "Failed to generate form"),
    }),
  );

  if (getQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (getQuery.isError || !getQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Inspection not found</AlertTitle>
        <AlertDescription>This inspection does not exist or you lack permission to view it.</AlertDescription>
      </Alert>
    );
  }

  const m = getQuery.data as InspectionResponse;

  const farmMap = new Map<string, FarmResponse>();
  for (const f of (farms.data?.data ?? []) as FarmResponse[]) {
    farmMap.set(f.id, f);
  }
  const userMap = new Map<string, UserSummary>();
  for (const u of (users.data ?? []) as UserSummary[]) {
    userMap.set(u.id, u);
  }

  const farmLabel = (fid: string) => {
    const f = farmMap.get(fid);
    return f ? `${f.farmId} · ${f.name}` : fid;
  };
  const inspectorLabel = (uid: string) => {
    const u = userMap.get(uid);
    const name = u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";
    return name || (u?.username ?? uid);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <StatusBadge value={m.status} map={INSPECTION_STATUS_VARIANT} />
          <span className="text-muted-foreground">{farmLabel(m.farmId)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <ActionDialog
            triggerLabel="Schedule"
            schema={scheduleInspectionRequestSchema}
            mutation={schedule}
            title="Schedule inspection"
            description="Set the on-spot inspection date."
            defaultValues={{ id: m.id }}
            fields={(form) => <DateField control={form.control} name="scheduledDate" label="Scheduled date" />}
          />
          <ActionDialog
            triggerLabel="Complete"
            schema={completeInspectionRequestSchema}
            mutation={complete}
            title="Complete inspection"
            description="Record the on-spot result and keeper sign-off."
            defaultValues={{ id: m.id }}
            fields={(form) => (
              <>
                <DateField control={form.control} name="inspectionDate" label="Inspection date" />
                <TextField control={form.control} name="result" label="Result" placeholder="e.g. PASS" />
                <TextareaField control={form.control} name="notes" label="Notes" placeholder="Optional" />
                <SwitchField control={form.control} name="discrepanciesFound" label="Discrepancies found" />
                <SwitchField control={form.control} name="keeperSigned" label="Keeper signed" />
                <SwitchField control={form.control} name="formReturned" label="Form returned" />
              </>
            )}
          />
          <ActionDialog
            triggerLabel="Print form"
            schema={printInspectionFormRequestSchema}
            mutation={printForm}
            title="Generate inspection form"
            description="Render the inspection-form document (YAML/XML)."
            defaultValues={{ id: m.id, language: LANGUAGE.MK }}
            fields={(form) => (
              <SelectField
                control={form.control}
                name="language"
                label="Language"
                options={enumToOptions(Object.values(LANGUAGE))}
              />
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Farm" value={farmLabel(m.farmId)} />
          <Field label="Inspector" value={inspectorLabel(m.inspectorId)} />
          <Field label="Status" value={m.status} />
          <Field label="Risk score" value={m.riskScore ?? "—"} />
          <Field label="Risk criteria" value={m.riskCriteria ?? "—"} />
          <Field label="Selected by risk analysis" value={m.selectedByRiskAnalysis ? "Yes" : "No"} />
          <Field label="Scheduled date" value={fmt(m.scheduledDate)} />
          <Field label="Inspection date" value={fmt(m.inspectionDate)} />
          <Field label="Result" value={m.result ?? "—"} />
          <Field label="Notes" value={m.notes ?? "—"} />
          <Field label="Discrepancies found" value={m.discrepanciesFound ? "Yes" : "No"} />
          <Field label="Form printed" value={m.formPrinted ? "Yes" : "No"} />
          <Field label="Form returned" value={m.formReturned ? "Yes" : "No"} />
          <Field label="Keeper signed" value={m.keeperSigned ? "Yes" : "No"} />
          <Field label="Stored at VI" value={m.storedAtVi ? "Yes" : "No"} />
          <Field label="Retention expiry" value={fmt(m.retentionExpiry)} />
          <Field label="Created" value={fmt(m.createdAt)} />
          <Field label="Updated" value={fmt(m.updatedAt)} />
        </div>
      </CardContent>
    </Card>
  );
}
