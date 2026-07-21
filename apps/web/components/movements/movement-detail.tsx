"use client";

import { Alert, AlertDescription, AlertTitle } from "@rocky/ui/components/alert";
import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Skeleton } from "@rocky/ui/components/skeleton";
import type { AnimalSummary, FarmResponse, MovementResponse } from "@rocky/validators/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileTextIcon, Loader2 } from "lucide-react";
import * as React from "react";
import { MOVEMENT_TYPE_VARIANT } from "#components/movements/columns";
import { StatusBadge } from "#components/shared/status-badge";
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
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const generatePdf = useMutation(trpc.document.generate.mutationOptions({}));

  if (getQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (getQuery.isError || !getQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Movement not found</AlertTitle>
        <AlertDescription>This movement does not exist or you lack permission to view it.</AlertDescription>
      </Alert>
    );
  }

  const m = getQuery.data as MovementResponse;

  const farmMap = new Map<string, FarmResponse>();
  for (const f of (farms.data?.data ?? []) as FarmResponse[]) {
    farmMap.set(f.id, f);
  }
  const animalMap = new Map<string, AnimalSummary>();
  for (const a of (animals.data?.data ?? []) as AnimalSummary[]) {
    animalMap.set(a.id, a);
  }

  const farmLabel = (fid?: string | null) => {
    if (!fid) return "—";
    const f = farmMap.get(fid);
    return f ? `${f.farmId} · ${f.name}` : fid;
  };
  const animalLabel = (aid: string) => {
    const a = animalMap.get(aid);
    return a ? `${a.stateCode}${a.earTagNumber}` : aid;
  };

  const handleDownloadPdf = async () => {
    setDownloadError(null);
    try {
      const body = JSON.stringify({
        json: { type: "movement", refId: m.id, format: "pdf" },
        meta: { values: {} as Record<string, never> },
      });
      const res = await fetch("/trpc/document.generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = (await res.json()) as Record<string, unknown>;
      const resultData = (json as any)?.result?.data;
      if (!resultData) {
        setDownloadError(`RAW: ${JSON.stringify(json).slice(0, 400)}`);
        return;
      }
      const resultJson = resultData.json;
      if (!resultJson) {
        setDownloadError(`No result data in response`);
        return;
      }
      if (resultJson.format === "yaml") {
        setDownloadError(`Server returned YAML! RefId: ${String(resultJson.documentType ?? "?")}`);
        return;
      }
      if (resultJson.format !== "pdf") {
        setDownloadError(`Unknown format: ${String(resultJson.format)}`);
        return;
      }
      const binary = atob(resultJson.content as string);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `movement-${m.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <StatusBadge value={m.type} map={MOVEMENT_TYPE_VARIANT} />
          <span className="text-muted-foreground">{animalLabel(m.animalId)}</span>
          {downloadError ? <span className="text-xs text-red-600 ml-2">{downloadError}</span> : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={generatePdf.isPending}
            className="ml-auto"
          >
            {generatePdf.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <FileTextIcon className="mr-1 h-4 w-4" />
            )}
            {generatePdf.isPending ? "Generating…" : "Download PDF"}
          </Button>
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
          value={m.isActive ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
        />
        <Field label="Created" value={fmt(m.createdAt)} />
        <Field label="Updated" value={fmt(m.updatedAt)} />
      </CardContent>
    </Card>
  );
}
