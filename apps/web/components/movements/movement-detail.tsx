"use client";

import * as React from "react";
import { format } from "date-fns";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Badge } from "@rocky/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Skeleton } from "@rocky/ui/components/skeleton";
import { StatusBadge } from "#components/shared/status-badge";
import { MOVEMENT_TYPE_VARIANT } from "#components/movements/columns";
import type { AnimalSummary, FarmResponse, MovementResponse } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
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

export function MovementDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const getQuery = useQuery(trpc.movement.getById.queryOptions({ id }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));

  if (getQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (getQuery.isError || !getQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Movement not found</AlertTitle>
        <AlertDescription>
          This movement does not exist or you lack permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  const m = getQuery.data as MovementResponse;

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => farmMap.set(f.id, f));
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => animalMap.set(a.id, a));

  const farmLabel = (fid?: string | null) => {
    if (!fid) return "—";
    const f = farmMap.get(fid);
    return f ? `${f.farmId} · ${f.name}` : fid;
  };
  const animalLabel = (aid: string) => {
    const a = animalMap.get(aid);
    return a ? `${a.stateCode}${a.earTagNumber}` : aid;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <StatusBadge value={m.type} map={MOVEMENT_TYPE_VARIANT} />
          <span className="text-muted-foreground">{animalLabel(m.animalId)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Animal" value={animalLabel(m.animalId)} />
        <Field label="From farm" value={farmLabel(m.fromFarmId)} />
        <Field label="To farm" value={farmLabel(m.toFarmId)} />
        <Field label="Movement date" value={fmt(m.movementDate)} />
        <Field label="Arrival date" value={fmt(m.arrivalDate)} />
        <Field label="Reason" value={m.reason ?? "—"} />
        <Field label="Document ref" value={m.documentRef ?? "—"} />
        <Field label="Death date" value={fmt(m.deathDate)} />
        <Field label="Death cause" value={m.deathCause ?? "—"} />
        <Field label="Import country" value={m.importCountry ?? "—"} />
        <Field label="Verified" value={m.isVerified ? "Yes" : "No"} />
        <Field
          label="Active"
          value={
            m.isActive ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>
          }
        />
        <Field label="Created" value={fmt(m.createdAt)} />
        <Field label="Updated" value={fmt(m.updatedAt)} />
      </CardContent>
    </Card>
  );
}
