"use client";

import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "#components/shared/status-badge";
import type {
  GeofenceEventResponse,
  GeofenceResponse,
  IotDeviceResponse,
  SensorReadingResponse,
} from "@rocky/validators/api";

export type { GeofenceEventResponse, GeofenceResponse, IotDeviceResponse, SensorReadingResponse } from "@rocky/validators/api";

export function deviceColumns(farmLabel: (id: string | null | undefined) => string): ColumnDef<IotDeviceResponse>[] {
  return [
    { accessorKey: "deviceEui", header: "EUI", enableSorting: false, cell: ({ row }) => row.original.deviceEui ?? "—" },
    { accessorKey: "manufacturer", header: "Manufacturer", enableSorting: false, cell: ({ row }) => row.original.manufacturer ?? "—" },
    { accessorKey: "model", header: "Model", enableSorting: false, cell: ({ row }) => row.original.model ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    { accessorKey: "assignedToFarmId", header: "Farm", enableSorting: false, cell: ({ row }) => farmLabel(row.original.assignedToFarmId) },
    {
      accessorKey: "batteryLevel",
      header: "Battery",
      enableSorting: false,
      cell: ({ row }) => (row.original.batteryLevel != null ? `${row.original.batteryLevel}%` : "—"),
    },
    {
      accessorKey: "lastTransmissionAt",
      header: "Last TX",
      enableSorting: false,
      cell: ({ row }) => (row.original.lastTransmissionAt ? format(row.original.lastTransmissionAt, "PP p") : "—"),
    },
  ];
}

export function sensorReadingColumns(
  deviceLabel: (id: string) => string,
  animalLabel: (id: string | null | undefined) => string,
): ColumnDef<SensorReadingResponse>[] {
  return [
    { accessorKey: "deviceId", header: "Device", enableSorting: false, cell: ({ row }) => deviceLabel(row.original.deviceId) },
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    {
      accessorKey: "readingType",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.readingType} />,
    },
    { accessorKey: "valueNumeric", header: "Value", enableSorting: false, cell: ({ row }) => row.original.valueNumeric ?? "—" },
    { accessorKey: "unit", header: "Unit", enableSorting: false, cell: ({ row }) => row.original.unit ?? "—" },
    {
      accessorKey: "recordedAt",
      header: "Recorded",
      enableSorting: false,
      cell: ({ row }) => format(row.original.recordedAt, "PP p"),
    },
    {
      accessorKey: "processingStage",
      header: "Stage",
      enableSorting: false,
      cell: ({ row }) => (row.original.processingStage ? <StatusBadge value={row.original.processingStage} /> : "—"),
    },
  ];
}

export function geofenceColumns(farmLabel: (id: string) => string): ColumnDef<GeofenceResponse>[] {
  return [
    { accessorKey: "name", header: "Name", enableSorting: false },
    { accessorKey: "farmId", header: "Farm", enableSorting: false, cell: ({ row }) => farmLabel(row.original.farmId) },
    {
      accessorKey: "fenceType",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.fenceType} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export function geofenceEventColumns(
  animalLabel: (id: string) => string,
  geofenceLabel: (id: string) => string,
): ColumnDef<GeofenceEventResponse>[] {
  return [
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    { accessorKey: "geofenceId", header: "Geofence", enableSorting: false, cell: ({ row }) => geofenceLabel(row.original.geofenceId) },
    {
      accessorKey: "eventType",
      header: "Event",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.eventType} />,
    },
    {
      accessorKey: "eventAt",
      header: "At",
      enableSorting: false,
      cell: ({ row }) => format(row.original.eventAt, "PP p"),
    },
    {
      accessorKey: "source",
      header: "Source",
      enableSorting: false,
      cell: ({ row }) => (row.original.source ? <StatusBadge value={row.original.source} /> : "—"),
    },
  ];
}
