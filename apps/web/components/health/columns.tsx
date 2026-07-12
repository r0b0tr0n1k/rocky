"use client";

import { format } from "date-fns";
import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@rocky/ui/components/badge";
import { StatusBadge } from "#components/shared/status-badge";
import type {
  DiseaseResponse,
  LabTestResponse,
  TreatmentResponse,
  VaccineBatchResponse,
  VaccineResponse,
  VaccinationResponse,
} from "@rocky/validators/api";

export type { DiseaseResponse, LabTestResponse, TreatmentResponse, VaccineBatchResponse, VaccineResponse, VaccinationResponse } from "@rocky/validators/api";

function trunc(value: string | null | undefined, n = 48): string {
  if (!value) return "—";
  return value.length > n ? `${value.slice(0, n)}…` : value;
}

/** Append a right-pinned row-action column when a renderer is provided. */
function withRowActions<T>(columns: ColumnDef<T>[], rowActions?: (row: T) => ReactNode): ColumnDef<T>[] {
  if (!rowActions) return columns;
  return [
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { width: 64, align: "right" },
      cell: ({ row }) => rowActions(row.original),
    },
  ];
}

export function diseaseColumns(opts?: { rowActions?: (disease: DiseaseResponse) => ReactNode }): ColumnDef<DiseaseResponse>[] {
  const columns: ColumnDef<DiseaseResponse>[] = [
    { accessorKey: "name", header: "Name", enableSorting: false },
    {
      accessorKey: "notifiable",
      header: "Notifiable",
      enableSorting: false,
      meta: { width: 124, align: "center" },
      cell: ({ row }) =>
        row.original.notifiable ? (
          <Badge variant="destructive">Notifiable</Badge>
        ) : (
          <Badge variant="secondary">Routine</Badge>
        ),
    },
    {
      accessorKey: "quarantineDays",
      header: "Quarantine (d)",
      enableSorting: false,
      meta: { width: 132, align: "right" },
      cell: ({ row }) => row.original.quarantineDays ?? "—",
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => trunc(row.original.description, 72),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, opts?.rowActions);
}

export function vaccineColumns(opts?: { rowActions?: (v: VaccineResponse) => ReactNode }): ColumnDef<VaccineResponse>[] {
  const columns: ColumnDef<VaccineResponse>[] = [
    { accessorKey: "name", header: "Name", enableSorting: false },
    { accessorKey: "manufacturer", header: "Manufacturer", enableSorting: false, cell: ({ row }) => row.original.manufacturer ?? "—" },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.type} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, opts?.rowActions);
}

export interface VaccineBatchLookups {
  vaccineLabel: (id: string) => string;
  rowActions?: (row: VaccineBatchResponse) => ReactNode;
}

export function vaccineBatchColumns({ vaccineLabel, rowActions }: VaccineBatchLookups): ColumnDef<VaccineBatchResponse>[] {
  const columns: ColumnDef<VaccineBatchResponse>[] = [
    { accessorKey: "vaccineId", header: "Vaccine", enableSorting: false, cell: ({ row }) => vaccineLabel(row.original.vaccineId) },
    { accessorKey: "batchNo", header: "Batch no", enableSorting: false },
    {
      accessorKey: "productionDate",
      header: "Produced",
      enableSorting: false,
      cell: ({ row }) => (row.original.productionDate ? format(row.original.productionDate, "PP") : "—"),
    },
    {
      accessorKey: "expiryDate",
      header: "Expires",
      enableSorting: false,
      cell: ({ row }) => (row.original.expiryDate ? format(row.original.expiryDate, "PP") : "—"),
    },
    { accessorKey: "quantityReceived", header: "Received", enableSorting: false },
    { accessorKey: "quantityRemaining", header: "Remaining", enableSorting: false },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, rowActions);
}

export interface VaccinationLookups {
  animalLabel: (id: string) => string;
  vaccineLabel: (id: string) => string;
  batchLabel: (id: string | null | undefined) => string;
  vetLabel: (id: string | null | undefined) => string;
  rowActions?: (row: VaccinationResponse) => ReactNode;
}

export function vaccinationColumns({ animalLabel, vaccineLabel, batchLabel, vetLabel, rowActions }: VaccinationLookups): ColumnDef<VaccinationResponse>[] {
  const columns: ColumnDef<VaccinationResponse>[] = [
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    { accessorKey: "vaccineId", header: "Vaccine", enableSorting: false, cell: ({ row }) => vaccineLabel(row.original.vaccineId) },
    { accessorKey: "batchId", header: "Batch", enableSorting: false, cell: ({ row }) => batchLabel(row.original.batchId) },
    { accessorKey: "vetId", header: "Vet", enableSorting: false, cell: ({ row }) => vetLabel(row.original.vetId) },
    {
      accessorKey: "adminDate",
      header: "Date",
      enableSorting: false,
      cell: ({ row }) => format(row.original.adminDate, "PP"),
    },
    {
      accessorKey: "route",
      header: "Route",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.route} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, rowActions);
}

export interface TreatmentLookups {
  animalLabel: (id: string) => string;
  diseaseLabel: (id: string | null | undefined) => string;
  vetLabel: (id: string | null | undefined) => string;
  rowActions?: (row: TreatmentResponse) => ReactNode;
}

export function treatmentColumns({ animalLabel, diseaseLabel, vetLabel, rowActions }: TreatmentLookups): ColumnDef<TreatmentResponse>[] {
  const columns: ColumnDef<TreatmentResponse>[] = [
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    { accessorKey: "diseaseId", header: "Disease", enableSorting: false, cell: ({ row }) => diseaseLabel(row.original.diseaseId) },
    { accessorKey: "vetId", header: "Vet", enableSorting: false, cell: ({ row }) => vetLabel(row.original.vetId) },
    {
      accessorKey: "diagnosisDate",
      header: "Diagnosed",
      enableSorting: false,
      cell: ({ row }) => format(row.original.diagnosisDate, "PP"),
    },
    {
      accessorKey: "treatmentDesc",
      header: "Treatment",
      enableSorting: false,
      cell: ({ row }) => trunc(row.original.treatmentDesc),
    },
    {
      accessorKey: "isolated",
      header: "Isolated",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isolated ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, rowActions);
}

export interface LabTestLookups {
  animalLabel: (id: string) => string;
  diseaseLabel: (id: string | null | undefined) => string;
  rowActions?: (row: LabTestResponse) => ReactNode;
}

export function labTestColumns({ animalLabel, diseaseLabel, rowActions }: LabTestLookups): ColumnDef<LabTestResponse>[] {
  const columns: ColumnDef<LabTestResponse>[] = [
    { accessorKey: "animalId", header: "Animal", enableSorting: false, cell: ({ row }) => animalLabel(row.original.animalId) },
    { accessorKey: "diseaseId", header: "Disease", enableSorting: false, cell: ({ row }) => diseaseLabel(row.original.diseaseId) },
    {
      accessorKey: "testType",
      header: "Test",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.testType} />,
    },
    {
      accessorKey: "result",
      header: "Result",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge value={row.original.result} />,
    },
    {
      accessorKey: "sampleDate",
      header: "Sampled",
      enableSorting: false,
      cell: ({ row }) => format(row.original.sampleDate, "PP"),
    },
    {
      accessorKey: "resultDate",
      header: "Resulted",
      enableSorting: false,
      cell: ({ row }) => (row.original.resultDate ? format(row.original.resultDate, "PP") : "—"),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      meta: { width: 128 },
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
  return withRowActions(columns, rowActions);
}
