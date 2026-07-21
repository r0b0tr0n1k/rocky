"use client";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Badge } from "@rocky/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Skeleton } from "@rocky/ui/components/skeleton";
import type {
  AnimalSummary,
  ArchiveDocumentResponse,
  FarmResponse,
  InspectionResponse,
  PassportResponse,
} from "@rocky/validators/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type * as React from "react";
import { z } from "zod";
import { ARCHIVE_DOCUMENT_TYPE_VARIANT, ARCHIVE_LOCATION_VARIANT } from "#components/archive/columns";
import { ActionDialog } from "#components/shared/action-dialog";
import { StatusBadge } from "#components/shared/status-badge";
import { notifyError, notifySuccess } from "#lib/notify";
import { useTRPC } from "#lib/trpc";

const idOnlySchema = z.object({ id: z.uuid() });

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

export function ArchiveDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getQuery = useQuery(trpc.archive.getById.queryOptions({ id }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const passports = useQuery(trpc.passport.list.queryOptions({ limit: 100 }));
  const inspections = useQuery(trpc.inspection.list.queryOptions({ limit: 100 }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.archive.getById.queryKey({ id }) });
  const markArchived = useMutation(
    trpc.archive.markArchived.mutationOptions({
      onSuccess: () => {
        invalidate();
        notifySuccess("Document archived");
      },
      onError: (error) => notifyError(error, "Failed to archive document"),
    }),
  );
  const markDestroyed = useMutation(
    trpc.archive.markDestroyed.mutationOptions({
      onSuccess: () => {
        invalidate();
        notifySuccess("Document destroyed");
      },
      onError: (error) => notifyError(error, "Failed to destroy document"),
    }),
  );

  if (getQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (getQuery.isError || !getQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Archive document not found</AlertTitle>
        <AlertDescription>This document does not exist or you lack permission to view it.</AlertDescription>
      </Alert>
    );
  }

  const m = getQuery.data as ArchiveDocumentResponse;

  const farmMap = new Map<string, FarmResponse>();
  for (const f of (farms.data?.data ?? []) as FarmResponse[]) {
    farmMap.set(f.id, f);
  }
  const animalMap = new Map<string, AnimalSummary>();
  for (const a of (animals.data?.data ?? []) as AnimalSummary[]) {
    animalMap.set(a.id, a);
  }
  const passportMap = new Map<string, PassportResponse>();
  for (const p of (passports.data?.data ?? []) as PassportResponse[]) {
    passportMap.set(p.id, p);
  }
  const inspectionMap = new Map<string, InspectionResponse>();
  for (const i of (inspections.data?.data ?? []) as InspectionResponse[]) {
    inspectionMap.set(i.id, i);
  }

  const farmLabel = (fid?: string | null) => {
    if (!fid) return "—";
    const f = farmMap.get(fid);
    return f ? `${f.farmId} · ${f.name}` : fid;
  };
  const animalLabel = (aid?: string | null) => {
    if (!aid) return "—";
    const a = animalMap.get(aid);
    return a ? `${a.stateCode}${a.earTagNumber}` : aid;
  };
  const passportLabel = (pid?: string | null) => {
    if (!pid) return "—";
    const p = passportMap.get(pid);
    return p ? p.passportNumber : pid;
  };
  const inspectionLabel = (iid?: string | null) => {
    if (!iid) return "—";
    const i = inspectionMap.get(iid);
    return i ? `Inspection ${i.id.slice(0, 8)}` : iid;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <StatusBadge value={m.documentType} map={ARCHIVE_DOCUMENT_TYPE_VARIANT} />
          <StatusBadge value={m.archiveLocation} map={ARCHIVE_LOCATION_VARIANT} />
          <span className="text-muted-foreground">{m.documentRef ?? "—"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <ActionDialog
            triggerLabel="Mark archived"
            schema={idOnlySchema}
            mutation={markArchived}
            title="Mark as archived"
            description="Move this document into the archived state."
            defaultValues={{ id: m.id }}
            fields={() => null}
          />
          <ActionDialog
            triggerLabel="Mark destroyed"
            schema={idOnlySchema}
            mutation={markDestroyed}
            title="Mark as destroyed"
            description="Permanently mark this document destroyed after retention."
            alert="This cannot be undone."
            defaultValues={{ id: m.id }}
            fields={() => null}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document type" value={m.documentType} />
          <Field label="Document ref" value={m.documentRef ?? "—"} />
          <Field label="Archive location" value={m.archiveLocation} />
          <Field label="Physical location" value={m.physicalLocation ?? "—"} />
          <Field label="Animal" value={animalLabel(m.animalId)} />
          <Field label="Farm" value={farmLabel(m.farmId)} />
          <Field label="Passport" value={passportLabel(m.passportId)} />
          <Field label="Inspection" value={inspectionLabel(m.inspectionId)} />
          <Field
            label="Retention expiry"
            value={<span className={m.isArchived ? "" : "text-destructive"}>{fmt(m.retentionExpiry)}</span>}
          />
          <Field
            label="Archived"
            value={m.isArchived ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}
          />
          <Field label="Archived at" value={fmt(m.archivedAt)} />
          <Field label="Destroyed at" value={fmt(m.destroyedAt)} />
          <Field label="Created" value={fmt(m.createdAt)} />
          <Field label="Updated" value={fmt(m.updatedAt)} />
        </div>
      </CardContent>
    </Card>
  );
}
