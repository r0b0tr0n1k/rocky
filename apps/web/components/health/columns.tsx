"use client";

import { format } from "date-fns";
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

export function diseaseColumns(): ColumnDef<DiseaseResponse>[] {
  return [
    { accessorKey: "name", header: "Name", enableSorting: false },
    {
      accessorKey: "notifiable",
      header: "Notifiable",
      enableSorting: false,
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
      cell: ({ row }) => row.original.quarantineDays ?? "—",
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => trunc(row.original.description),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      enableSorting: false,
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export function vaccineColumns(): ColumnDef<VaccineResponse>[] {
  return [
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
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export interface VaccineBatchLookups {
  vaccineLabel: (id: string) => string;
}

export function vaccineBatchColumns({ vaccineLabel }: VaccineBatchLookups): ColumnDef<VaccineBatchResponse>[] {
  return [
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
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export interface VaccinationLookups {
  animalLabel: (id: string) => string;
  vaccineLabel: (id: string) => string;
  batchLabel: (id: string | null | undefined) => string;
  vetLabel: (id: string | null | undefined) => string;
}

export function vaccinationColumns({ animalLabel, vaccineLabel, batchLabel, vetLabel }: VaccinationLookups): ColumnDef<VaccinationResponse>[] {
  return [
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
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export interface TreatmentLookups {
  animalLabel: (id: string) => string;
  diseaseLabel: (id: string | null | undefined) => string;
  vetLabel: (id: string | null | undefined) => string;
}

export function treatmentColumns({ animalLabel, diseaseLabel, vetLabel }: TreatmentLookups): ColumnDef<TreatmentResponse>[] {
  return [
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
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}

export interface LabTestLookups {
  animalLabel: (id: string) => string;
  diseaseLabel: (id: string | null | undefined) => string;
}

export function labTestColumns({ animalLabel, diseaseLabel }: LabTestLookups): ColumnDef<LabTestResponse>[] {
  return [
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
      cell: ({ row }) => format(row.original.createdAt, "PP"),
    },
  ];
}
