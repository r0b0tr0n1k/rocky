"use client";

import { Card, CardContent } from "@rocky/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rocky/ui/components/select";
import type { AnimalSummary } from "@rocky/validators/api";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { PageHeader } from "#components/shared/page-header";
import { Timeline, type TimelineItem } from "#components/shared/timeline";
import { useTRPC } from "#lib/trpc";

export default function MovementLineagePage() {
  const trpc = useTRPC();
  const [animalId, setAnimalId] = React.useState<string | undefined>(undefined);

  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100, offset: 0 }));
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: a.earTagNumber,
  }));

  const lineage = useQuery(
    trpc.movement.getLineage.queryOptions({ animalId: animalId ?? "" }, { enabled: !!animalId }),
  );

  // The lineage graph's EDGES are the movements; project them (oldest ->
  // newest) into TimelineItems. Parentage edges are excluded.
  const items: TimelineItem[] = React.useMemo(() => {
    const g = lineage.data;
    if (!g) return [];
    const labelOf = new Map(g.nodes.map((n) => [n.id, n.label ?? n.id]));
    const movements = g.edges
      .filter((e) => e.kind === "movement")
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return movements.map((e, i) => ({
      title: e.type ?? "movement",
      description: [e.from ? labelOf.get(e.from) : null, e.to ? labelOf.get(e.to) : null].filter(Boolean).join(" → "),
      timestamp: e.date ? new Date(e.date).toLocaleDateString() : undefined,
      // The most recent movement is "current"; the rest are completed.
      status: i === movements.length - 1 ? ("current" as const) : ("done" as const),
    }));
  }, [lineage.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movement Lineage"
        description="Chronological movement history for an animal (birth, transfers, sales, pasture, slaughter, imports)."
      />

      <Select value={animalId ?? "all"} onValueChange={(v) => setAnimalId(v === "all" ? undefined : v)}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select an animal…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All animals</SelectItem>
          {animalOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-6">
          {lineage.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movements recorded for this animal.</p>
          ) : (
            <Timeline items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
