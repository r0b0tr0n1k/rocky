"use client";

import * as React from "react";

import {
  createGeofenceRequestSchema,
  ingestReadingRequestSchema,
  logGeofenceEventRequestSchema,
  registerDeviceRequestSchema,
  type AnimalSummary,
  type FarmResponse,
  type GeofenceEventResponse,
  type GeofenceResponse,
  type IotDeviceResponse,
  type IotDeviceSummary,
  type SensorReadingResponse,
} from "@rocky/validators/api";
import {
  FENCE_TYPE,
  GEOFENCE_EVENT_SOURCE,
  GEOFENCE_EVENT_TYPE,
  IOT_DEVICE_STATUS,
  READING_TYPE,
  TRANSMISSION_TYPE,
} from "@rocky/validators/enums";
import { ComboboxField, NumberField, SelectField, TextField } from "#components/shared/form-fields";
import { ActionDialog } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import {
  deviceColumns,
  geofenceColumns,
  geofenceEventColumns,
  sensorReadingColumns,
} from "#components/iot/columns";
import { enumToOptions } from "#lib/options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";
import { Label } from "@rocky/ui/components/label";
import { Textarea } from "@rocky/ui/components/textarea";

const PAGE_SIZE = 20;

export default function IotPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const devices = useQuery(trpc.iot.listDevices.queryOptions({ limit: 100 }));

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => farmMap.set(f.id, f));
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => animalMap.set(a.id, a));
  const deviceMap = new Map<string, IotDeviceSummary>();
  ((devices.data?.data ?? []) as IotDeviceSummary[]).forEach((d) => deviceMap.set(d.id, d));

  const farmLabel = (id: string | null | undefined) => (id ? (farmMap.get(id)?.name ?? id) : "—");
  const animalLabel = (id: string | null | undefined) => {
    if (!id) return "—";
    const a = animalMap.get(id);
    return a ? `${a.stateCode}${a.earTagNumber}` : id;
  };
  const deviceLabel = (id: string) => {
    const d = deviceMap.get(id);
    return d ? (d.deviceEui ?? d.manufacturer ?? d.model ?? id) : id;
  };

  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: `${a.stateCode}${a.earTagNumber}`,
  }));
  const deviceOptions = ((devices.data?.data ?? []) as IotDeviceSummary[]).map((d) => ({
    value: d.id,
    label: d.deviceEui ?? d.manufacturer ?? d.model ?? d.id,
  }));

  const [selectedFarmId, setSelectedFarmId] = React.useState<string | undefined>(undefined);
  const effectiveFarmId = selectedFarmId ?? (farms.data?.data?.[0] as FarmResponse | undefined)?.id;

  const geofences = useQuery(trpc.iot.listGeofences.queryOptions({ farmId: effectiveFarmId! }, { enabled: !!effectiveFarmId }));
  const geofenceOptions = ((geofences.data ?? []) as GeofenceResponse[]).map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const devicesQ = useQuery(trpc.iot.listDevices.queryOptions({ limit: PAGE_SIZE }));
  const readingsQ = useQuery(trpc.iot.listReadings.queryOptions({ limit: 100 }));
  const eventsQ = useQuery(trpc.iot.listGeofenceEvents.queryOptions({ limit: 50 }));

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const registerDevice = useMutation(trpc.iot.registerDevice.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listDevices.queryKey()) }));
  const ingestReading = useMutation(trpc.iot.ingestReading.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listReadings.queryKey()) }));
  const createGeofence = useMutation(trpc.iot.createGeofence.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listGeofences.queryKey({ farmId: effectiveFarmId! })) }));
  const logEvent = useMutation(trpc.iot.logGeofenceEvent.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listGeofenceEvents.queryKey()) }));

  const nowIso = () => new Date().toISOString();
  const defaultGeometry = {
    type: "circle",
    center: { latitude: 0, longitude: 0 },
    radiusMeters: 100,
  } as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="IoT" description="Device registry, sensor readings, geofences, and geofence events." />
      <Tabs defaultValue="devices" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="readings">Readings</TabsTrigger>
          <TabsTrigger value="geofences">Geofences</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DataTable
            columns={deviceColumns(farmLabel)}
            data={(devicesQ.data?.data ?? []) as IotDeviceResponse[]}
            total={devicesQ.data?.total ?? 0}
            isLoading={devicesQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Register device"
              schema={registerDeviceRequestSchema}
              mutation={registerDevice}
              title="Register IoT device"
              description="Add a collar, tag, or gateway to the registry."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="deviceEui" label="Device EUI" placeholder="Optional" />
                  <TextField control={form.control} name="manufacturer" label="Manufacturer" placeholder="Optional" />
                  <TextField control={form.control} name="model" label="Model" placeholder="Optional" />
                  <TextField control={form.control} name="serialNumber" label="Serial number" placeholder="Optional" />
                  <TextField control={form.control} name="firmwareVersion" label="Firmware" placeholder="Optional" />
                  <SelectField control={form.control} name="transmissionType" label="Transmission" options={enumToOptions(Object.values(TRANSMISSION_TYPE))} />
                  <NumberField control={form.control} name="transmissionIntervalSeconds" label="Interval (s)" placeholder="Optional" />
                  <ComboboxField control={form.control} name="assignedToAnimalId" label="Assigned animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="assignedToFarmId" label="Assigned farm" placeholder="Search farms…" options={farmOptions} />
                  <TextField control={form.control} name="activationDate" label="Activation date" placeholder="YYYY-MM-DD (optional)" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="readings">
          <DataTable
            columns={sensorReadingColumns(deviceLabel, animalLabel)}
            data={(readingsQ.data?.data ?? []) as SensorReadingResponse[]}
            total={readingsQ.data?.total ?? 0}
            isLoading={readingsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Ingest reading"
              schema={ingestReadingRequestSchema}
              mutation={ingestReading}
              title="Ingest sensor reading"
              description="Record a raw sensor reading."
              defaultValues={{ recordedAt: nowIso() }}
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="deviceId" label="Device" placeholder="Search devices…" options={deviceOptions} />
                  <ComboboxField control={form.control} name="animalId" label="Animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <TextField control={form.control} name="recordedAt" label="Recorded at (ISO)" placeholder="2026-07-08T12:00:00Z" />
                  <SelectField control={form.control} name="readingType" label="Reading type" options={enumToOptions(Object.values(READING_TYPE))} />
                  <NumberField control={form.control} name="valueNumeric" label="Value" placeholder="Optional" />
                  <TextField control={form.control} name="unit" label="Unit" placeholder="Optional" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="geofences">
          <div className="mb-4 flex items-center gap-2">
            <Label className="text-sm">Farm</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={effectiveFarmId ?? ""}
              onChange={(e) => setSelectedFarmId(e.target.value || undefined)}
            >
              <option value="" disabled>
                Select farm…
              </option>
              {farmOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <DataTable
            columns={geofenceColumns(farmLabel)}
            data={(geofences.data ?? []) as GeofenceResponse[]}
            total={(geofences.data ?? []).length}
            isLoading={geofences.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="New geofence"
              schema={createGeofenceRequestSchema}
              mutation={createGeofence}
              title="New geofence"
              description="Define a virtual or physical boundary for a farm."
              defaultValues={{ farmId: effectiveFarmId, geometry: defaultGeometry }}
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <TextField control={form.control} name="name" label="Name" placeholder="e.g. North pasture" />
                  <TextField control={form.control} name="description" label="Description" placeholder="Optional" />
                  <SelectField control={form.control} name="fenceType" label="Fence type" options={enumToOptions(Object.values(FENCE_TYPE))} />
                  <Label className="text-sm">Geometry (JSON)</Label>
                  <Textarea
                    defaultValue={JSON.stringify(defaultGeometry, null, 2)}
                    className="font-mono text-xs"
                    onChange={(e) => {
                      try {
                        form.setValue("geometry", JSON.parse(e.target.value) as typeof defaultGeometry, { shouldValidate: true });
                      } catch {
                        /* ignore invalid JSON while typing */
                      }
                    }}
                  />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="events">
          <DataTable
            columns={geofenceEventColumns(animalLabel, (id) => deviceMap.get(id)?.deviceEui ?? geofenceOptions.find((o) => o.value === id)?.label ?? id)}
            data={(eventsQ.data?.data ?? []) as GeofenceEventResponse[]}
            total={eventsQ.data?.total ?? 0}
            isLoading={eventsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Log event"
              schema={logGeofenceEventRequestSchema}
              mutation={logEvent}
              title="Log geofence event"
              description="Record an animal entering or leaving a geofence."
              defaultValues={{ eventAt: nowIso(), source: "manual" }}
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="animalId" label="Animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="geofenceId" label="Geofence" placeholder="Select farm first…" options={geofenceOptions} />
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <SelectField control={form.control} name="eventType" label="Event type" options={enumToOptions(Object.values(GEOFENCE_EVENT_TYPE))} />
                  <TextField control={form.control} name="eventAt" label="Event at (ISO)" placeholder="2026-07-08T12:00:00Z" />
                  <SelectField control={form.control} name="source" label="Source" options={enumToOptions(Object.values(GEOFENCE_EVENT_SOURCE))} />
                </>
              )}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
