"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@rocky/ui/components/button";
import { Input } from "@rocky/ui/components/input";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

export default function SyncPage() {
  const trpc = useTRPC();
  const [since, setSince] = React.useState<string>("");

  const download = useQuery({
    ...trpc.sync.syncDownload.queryOptions({ since: since ? since : null }),
    enabled: false,
  });

  const d = download.data;
  const counts: [string, number][] = d
    ? [
        ["Animals", d.animals.length],
        ["Farms", d.farms.length],
        ["Movements", d.movements.length],
        ["Inspections", d.inspections.length],
        ["Ear tags", d.earTags.length],
        ["Diseases", d.diseases.length],
        ["Vaccines", d.vaccines.length],
        ["Batches", d.batches.length],
        ["Vaccine diseases", d.vaccineDiseases.length],
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Offline Sync"
        description="Pull an RLS-scoped field-entity snapshot for the mobile PDA fleet."
      />

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Since (optional)</span>
          <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </div>
        <Button onClick={() => download.refetch()} disabled={download.isFetching}>
          <Download data-icon="inline-start" /> Pull snapshot
        </Button>
      </div>

      {download.isError ? (
        <p className="text-sm text-destructive">Sync failed: {String(download.error)}</p>
      ) : null}

      {d ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {counts.map(([label, n]) => (
            <div key={label} className="rounded-md border p-3">
              <div className="text-2xl font-semibold tabular-nums">{n}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
          <div className="col-span-2 rounded-md border p-3 sm:col-span-3">
            <div className="text-xs text-muted-foreground">Synced at</div>
            <div className="text-sm">{new Date(d.syncedAt).toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">Watermark</div>
            <div className="text-sm">
              {d.watermark ? new Date(d.watermark).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
