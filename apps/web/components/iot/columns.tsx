"use client";

import type { IotDeviceResponse, SensorReadingResponse } from "@rocky/validators/api";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { StatusBadge } from "#components/shared/status-badge";

export type { IotDeviceResponse, SensorReadingResponse } from "@rocky/validators/api";

export function deviceColumns(farmLabel: (id: string | null | undefined) => string): ColumnDef<IotDeviceResponse>[] {
  return [
    { accessorKey: "deviceEui", header: "EUI", enableSorting: false, cell: ({ row }) => row.original.deviceEui ?? "—" },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      enableSorting: false,
      cell: ({ row }) => row.original.manufacturer ?? "—",
    },
    { accessorKey: "model", header: "Model", enableSorting: false, cell: ({ row }) => row.original.model ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      accessorKey: "assignedToFarmId",
      header: "Farm",
      enableSorting: false,
      cell: ({ row }) => farmLabel(row.original.assignedToFarmId),
    },
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
    {
      accessorKey: "deviceId",
      header: "Device",
      enableSorting: false,
      cell: ({ row }) => deviceLabel(row.original.deviceId),
    },
    {
      accessorKey: "animalId",
      header: "Animal",
      enableSorting: false,
      cell: ({ row }) => animalLabel(row.original.animalId),
    },
    {
      accessorKey: "readingType",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.readingType} />,
    },
    {
      accessorKey: "valueNumeric",
      header: "Value",
      enableSorting: false,
      cell: ({ row }) => row.original.valueNumeric ?? "—",
    },
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
