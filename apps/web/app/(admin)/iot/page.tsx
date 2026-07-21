"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";
import {
  type AnimalSummary,
  type FarmResponse,
  type IotDeviceResponse,
  type IotDeviceSummary,
  ingestReadingRequestSchema,
  registerDeviceRequestSchema,
  type SensorReadingResponse,
} from "@rocky/validators/api";
import { READING_TYPE, TRANSMISSION_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deviceColumns, sensorReadingColumns } from "#components/iot/columns";
import { ActionDialog, RowActionMenu } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { ComboboxField, NumberField, SelectField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { type DetailField, RowDetailsDialog } from "#components/shared/row-details-dialog";
import { appendRowActions, TableCard, tableDensityClass } from "#components/shared/table-card";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

const PAGE_SIZE = 20;

export default function IotPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const devices = useQuery(trpc.iot.listDevices.queryOptions({ limit: 100 }));

  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => {
    farmMap.set(f.id, f);
  });
  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => {
    animalMap.set(a.id, a);
  });
  const deviceMap = new Map<string, IotDeviceSummary>();
  ((devices.data?.data ?? []) as IotDeviceSummary[]).forEach((d) => {
    deviceMap.set(d.id, d);
  });

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

  const devicesQ = useQuery(trpc.iot.listDevices.queryOptions({ limit: PAGE_SIZE }));
  const readingsQ = useQuery(trpc.iot.listReadings.queryOptions({ limit: 100 }));

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const registerDevice = useMutation(
    trpc.iot.registerDevice.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listDevices.queryKey()) }),
  );
  const ingestReading = useMutation(
    trpc.iot.ingestReading.mutationOptions({ onSuccess: () => invalidate(trpc.iot.listReadings.queryKey()) }),
  );

  const nowIso = () => new Date().toISOString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="IoT" description="Device registry and sensor readings." />
      <Tabs defaultValue="devices" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="readings">Readings</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <TableCard
            action={
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
                    <TextField
                      control={form.control}
                      name="serialNumber"
                      label="Serial number"
                      placeholder="Optional"
                    />
                    <TextField control={form.control} name="firmwareVersion" label="Firmware" placeholder="Optional" />
                    <SelectField
                      control={form.control}
                      name="transmissionType"
                      label="Transmission"
                      options={enumToOptions(Object.values(TRANSMISSION_TYPE))}
                    />
                    <NumberField
                      control={form.control}
                      name="transmissionIntervalSeconds"
                      label="Interval (s)"
                      placeholder="Optional"
                    />
                    <ComboboxField
                      control={form.control}
                      name="assignedToAnimalId"
                      label="Assigned animal"
                      placeholder="Search animals…"
                      options={animalOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="assignedToFarmId"
                      label="Assigned farm"
                      placeholder="Search farms…"
                      options={farmOptions}
                    />
                    <TextField
                      control={form.control}
                      name="activationDate"
                      label="Activation date"
                      placeholder="YYYY-MM-DD (optional)"
                    />
                  </>
                )}
              />
            }
          >
            <DataTable
              columns={appendRowActions(deviceColumns(farmLabel), (row) => (
                <RowActionMenu items={[{ type: "dialog", dialog: <DeviceDetails device={row} /> }]} />
              ))}
              data={(devicesQ.data?.data ?? []) as IotDeviceResponse[]}
              total={devicesQ.data?.total ?? 0}
              isLoading={devicesQ.isLoading}
              page={0}
              pageSize={PAGE_SIZE}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>

        <TabsContent value="readings">
          <TableCard
            action={
              <ActionDialog
                triggerLabel="Ingest reading"
                schema={ingestReadingRequestSchema}
                mutation={ingestReading}
                title="Ingest sensor reading"
                description="Record a raw sensor reading."
                defaultValues={{ recordedAt: nowIso() }}
                fields={(form) => (
                  <>
                    <ComboboxField
                      control={form.control}
                      name="deviceId"
                      label="Device"
                      placeholder="Search devices…"
                      options={deviceOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="animalId"
                      label="Animal"
                      placeholder="Search animals…"
                      options={animalOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="farmId"
                      label="Farm"
                      placeholder="Search farms…"
                      options={farmOptions}
                    />
                    <TextField
                      control={form.control}
                      name="recordedAt"
                      label="Recorded at (ISO)"
                      placeholder="2026-07-08T12:00:00Z"
                    />
                    <SelectField
                      control={form.control}
                      name="readingType"
                      label="Reading type"
                      options={enumToOptions(Object.values(READING_TYPE))}
                    />
                    <NumberField control={form.control} name="valueNumeric" label="Value" placeholder="Optional" />
                    <TextField control={form.control} name="unit" label="Unit" placeholder="Optional" />
                  </>
                )}
              />
            }
          >
            <DataTable
              columns={appendRowActions(sensorReadingColumns(deviceLabel, animalLabel), (row) => (
                <RowActionMenu items={[{ type: "dialog", dialog: <SensorReadingDetails reading={row} /> }]} />
              ))}
              data={(readingsQ.data?.data ?? []) as SensorReadingResponse[]}
              total={readingsQ.data?.total ?? 0}
              isLoading={readingsQ.isLoading}
              page={0}
              pageSize={PAGE_SIZE}
              bordered={false}
              tableClassName={tableDensityClass}
            />
          </TableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Read-only detail inspectors (one per IoT entity) ──

function DeviceDetails({ device }: { device: IotDeviceResponse }) {
  const fields: DetailField[] = [
    { label: "EUI", value: device.deviceEui ?? "—" },
    { label: "Manufacturer", value: device.manufacturer ?? "—" },
    { label: "Model", value: device.model ?? "—" },
    { label: "Status", value: device.status },
    { label: "Farm", value: device.assignedToFarmId ?? "—" },
    { label: "Last TX", value: device.lastTransmissionAt ? new Date(device.lastTransmissionAt).toLocaleString() : "—" },
  ];
  return <RowDetailsDialog title={device.deviceEui ?? device.id} description="IoT device" fields={fields} />;
}

function SensorReadingDetails({ reading }: { reading: SensorReadingResponse }) {
  const fields: DetailField[] = [
    { label: "Device", value: reading.deviceId },
    { label: "Reading type", value: reading.readingType },
    {
      label: "Value",
      value:
        reading.valueNumeric != null
          ? `${reading.valueNumeric}${reading.unit ? ` ${reading.unit}` : ""}`
          : (reading.unit ?? "—"),
    },
    { label: "Recorded", value: new Date(reading.recordedAt).toLocaleString() },
    { label: "Stage", value: reading.processingStage ?? "—" },
    { label: "Created", value: new Date(reading.createdAt).toLocaleString() },
  ];
  return <RowDetailsDialog title="Sensor reading" description="Raw sensor reading" fields={fields} />;
}
