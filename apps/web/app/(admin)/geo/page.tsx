"use client";

import { Badge } from "@rocky/ui/components/badge";
import { Button } from "@rocky/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { Input } from "@rocky/ui/components/input";
import { type GeoMapFeature, type GeoMapVertex, GeoMapView } from "@rocky/ui/components/map";
import type { GeofenceResponse } from "@rocky/validators/api";
import { FENCE_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { PageHeader } from "#components/shared/page-header";
import { useTRPC } from "#lib/trpc";

const MAPTILER_KEY = (process.env as Record<string, string | undefined>).NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
// EUDR reference cutoff year for the deforestation overlay.
const CUTOFF_YEAR = 2020;

function geofenceToFeature(g: GeofenceResponse): GeoMapFeature | null {
  const polygon = (g as unknown as { polygon?: unknown }).polygon;
  if (!polygon) return null;
  return {
    id: g.id,
    geometry: polygon,
    kind: g.fenceType === FENCE_TYPE.DISEASE_ZONE ? "disease_zone" : "geofence",
    properties: { name: g.name },
  };
}

export default function GeoPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const [farmId, setFarmId] = React.useState<string>("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [drawMode, setDrawMode] = React.useState(false);
  const [showForest, setShowForest] = React.useState(false);
  const [draft, setDraft] = React.useState<{
    vertices: GeoMapVertex[];
    name: string;
    fenceType: string;
    freeSince: string;
  } | null>(null);

  const geofences = useQuery(trpc.geo.listGeofences.queryOptions({ farmId }, { enabled: Boolean(farmId) }));
  const diseaseZones = useQuery(trpc.geo.findActiveDiseaseZones.queryOptions({ farmId }, { enabled: Boolean(farmId) }));
  const assessment = useQuery(
    trpc.geo.assessDeforestation.queryOptions(
      { geofenceId: selectedId ?? "", cutoffYear: CUTOFF_YEAR },
      { enabled: Boolean(selectedId) },
    ),
  );
  // WO-143 — Forest / EUDR overlay: paints each geofence green (intact) / red (breached).
  const forestLayer = useQuery(
    trpc.geo.forestLayer.queryOptions({ farmId, cutoffYear: CUTOFF_YEAR }, { enabled: Boolean(farmId) && showForest }),
  );

  const createGeofence = useMutation(
    trpc.geo.createGeofence.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.geo.listGeofences.queryKey({ farmId }) });
        queryClient.invalidateQueries({ queryKey: trpc.geo.findActiveDiseaseZones.queryKey({ farmId }) });
        setDraft(null);
        setDrawMode(false);
      },
    }),
  );

  const forestFeatures = React.useMemo<GeoMapFeature[]>(
    () => (forestLayer.data ?? []).filter(Boolean) as GeoMapFeature[],
    [forestLayer.data],
  );

  const features = React.useMemo<GeoMapFeature[]>(() => {
    const dz = (diseaseZones.data ?? []).map(geofenceToFeature).filter((f): f is GeoMapFeature => f !== null);
    const gf = showForest
      ? forestFeatures
      : (geofences.data ?? []).map(geofenceToFeature).filter((f): f is GeoMapFeature => f !== null);
    return [...gf, ...dz];
  }, [geofences.data, diseaseZones.data, forestFeatures, showForest]);

  const allGeofences = React.useMemo<GeofenceResponse[]>(
    () => (geofences.data ?? []) as GeofenceResponse[],
    [geofences.data],
  );

  function handlePolygonDrawn(vertices: GeoMapVertex[]) {
    if (vertices.length < 3) return;
    setDraft({ vertices, name: "", fenceType: Object.values(FENCE_TYPE)[0] ?? "PASTURE", freeSince: "" });
  }

  function saveDraft() {
    if (!draft || !farmId) return;
    createGeofence.mutate({
      farmId,
      name: draft.name.trim() || "New geofence",
      fenceType: draft.fenceType as (typeof FENCE_TYPE)[keyof typeof FENCE_TYPE],
      deforestationFreeSince: draft.freeSince || undefined,
      geometry: { type: "polygon", vertices: draft.vertices },
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Geo & EUDR Map" description="Geofences, disease zones and the deforestation overlay" />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="farm-select">
          Farm
        </label>
        <select
          id="farm-select"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={farmId}
          onChange={(e) => {
            setFarmId(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="">Select a farm…</option>
          {(farms.data?.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <Button
          variant={drawMode ? "default" : "outline"}
          size="sm"
          disabled={!farmId}
          onClick={() => setDrawMode((d) => !d)}
        >
          {drawMode ? "Drawing… (double-click to finish)" : "Draw geofence"}
        </Button>
        <Button
          variant={showForest ? "default" : "outline"}
          size="sm"
          disabled={!farmId}
          onClick={() => setShowForest((s) => !s)}
          title="Paint each geofence by EUDR deforestation status (green = intact, red = breached)"
        >
          {showForest ? "Forest / EUDR: ON" : "Forest / EUDR overlay"}
        </Button>
      </div>

      {!MAPTILER_KEY ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Set <code>NEXT_PUBLIC_MAPTILER_API_KEY</code> in <code>apps/web/.env</code> to render the interactive map.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardContent className="p-2">
              <GeoMapView
                styleUrl={STYLE_URL}
                features={features}
                fitToFeatures
                height={520}
                drawMode={drawMode}
                onPolygonDrawn={handlePolygonDrawn}
                onFeatureClick={(id) => setSelectedId(id)}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geofences ({allGeofences.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allGeofences.length === 0 && (
                  <p className="text-sm text-muted-foreground">No geofences for this farm.</p>
                )}
                {allGeofences.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                      selectedId === g.id ? "border-primary" : ""
                    }`}
                  >
                    <span>{g.name}</span>
                    <Badge variant={g.fenceType === FENCE_TYPE.DISEASE_ZONE ? "destructive" : "secondary"}>
                      {g.fenceType}
                    </Badge>
                  </button>
                ))}

                {selectedId && (
                  <div className="mt-3 rounded-md border bg-muted/40 p-3 text-sm">
                    <div className="mb-2 font-medium">EUDR deforestation check</div>
                    {assessment.isLoading && <p>Assessing…</p>}
                    {assessment.data && (
                      <div className="space-y-1">
                        <Badge variant={assessment.data.compliant ? "default" : "destructive"}>
                          {assessment.data.compliant ? "Compliant" : "Breach"}
                        </Badge>
                        <p>
                          Deforested pixels: {assessment.data.deforestedPixels} / {assessment.data.totalPixels}
                        </p>
                        <p>Source: {assessment.data.source}</p>
                        <p>
                          Free since:{" "}
                          {assessment.data.deforestationFreeSince
                            ? assessment.data.deforestationFreeSince.toISOString().slice(0, 10)
                            : "n/a"}
                        </p>
                      </div>
                    )}
                    {assessment.isError && <p className="text-destructive">Assessment failed.</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {draft && (
              <Card>
                <CardHeader>
                  <CardTitle>New geofence ({draft.vertices.length} pts)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" htmlFor="gf-name">
                      Name
                    </label>
                    <Input
                      id="gf-name"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Pasture north"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" htmlFor="gf-type">
                      Fence type
                    </label>
                    <select
                      id="gf-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={draft.fenceType}
                      onChange={(e) => setDraft({ ...draft, fenceType: e.target.value })}
                    >
                      {Object.values(FENCE_TYPE).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" htmlFor="gf-free">
                      Deforestation-free since (optional)
                    </label>
                    <Input
                      id="gf-free"
                      type="date"
                      value={draft.freeSince}
                      onChange={(e) => setDraft({ ...draft, freeSince: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveDraft} disabled={createGeofence.isPending}>
                      {createGeofence.isPending ? "Saving…" : "Save geofence"}
                    </Button>
                    <Button variant="ghost" onClick={() => setDraft(null)}>
                      Cancel
                    </Button>
                  </div>
                  {createGeofence.isError && <p className="text-xs text-destructive">Could not create geofence.</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
