"use client";

import * as React from "react";

import {
  createDiseaseRequestSchema,
  createVaccineBatchRequestSchema,
  createVaccineRequestSchema,
  recordLabTestRequestSchema,
  recordTreatmentRequestSchema,
  recordVaccinationRequestSchema,
  type AnimalSummary,
  type DiseaseResponse,
  type FarmResponse,
  type LabTestResponse,
  type TreatmentResponse,
  type UserSummary,
  type VaccineBatchResponse,
  type VaccineResponse,
  type VaccinationResponse,
} from "@rocky/validators/api";
import {
  administrationRouteSchema,
  TEST_RESULT,
  TEST_TYPE,
  VACCINE_TYPE,
} from "@rocky/validators/enums";
import {
  ComboboxField,
  DateField,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "#components/shared/form-fields";
import { ActionDialog } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import { PageHeader } from "#components/shared/page-header";
import {
  diseaseColumns,
  labTestColumns,
  treatmentColumns,
  vaccineBatchColumns,
  vaccinationColumns,
  vaccineColumns,
} from "#components/health/columns";
import { enumToOptions } from "#lib/options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";

const PAGE_SIZE = 20;

export default function HealthPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // -- Reference lookups (shared across tabs) --
  const animals = useQuery(trpc.animal.list.queryOptions({ limit: 100 }));
  const farms = useQuery(trpc.farm.list.queryOptions({ limit: 100 }));
  const vaccines = useQuery(trpc.health.listVaccines.queryOptions({ limit: 100 }));
  const batches = useQuery(trpc.health.listBatches.queryOptions({ limit: 100 }));
  const diseases = useQuery(trpc.health.listDiseases.queryOptions({ limit: 100 }));
  const users = useQuery(trpc.user.list.queryOptions({ limit: 100 }));

  const animalMap = new Map<string, AnimalSummary>();
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => animalMap.set(a.id, a));
  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => farmMap.set(f.id, f));
  const vaccineMap = new Map<string, VaccineResponse>();
  ((vaccines.data?.data ?? []) as VaccineResponse[]).forEach((v) => vaccineMap.set(v.id, v));
  const batchMap = new Map<string, VaccineBatchResponse>();
  ((batches.data?.data ?? []) as VaccineBatchResponse[]).forEach((b) => batchMap.set(b.id, b));
  const diseaseMap = new Map<string, DiseaseResponse>();
  ((diseases.data?.data ?? []) as DiseaseResponse[]).forEach((d) => diseaseMap.set(d.id, d));
  const userMap = new Map<string, UserSummary>();
  ((users.data ?? []) as UserSummary[]).forEach((u) => userMap.set(u.id, u));

  const animalLabel = (id: string) => {
    const a = animalMap.get(id);
    return a ? `${a.stateCode}${a.earTagNumber}` : id;
  };
  const animalOptions = ((animals.data?.data ?? []) as AnimalSummary[]).map((a) => ({
    value: a.id,
    label: `${a.stateCode}${a.earTagNumber}`,
  }));
  const farmOptions = ((farms.data?.data ?? []) as FarmResponse[]).map((f) => ({
    value: f.id,
    label: `${f.farmId} · ${f.name}`,
  }));
  const vaccineOptions = ((vaccines.data?.data ?? []) as VaccineResponse[]).map((v) => ({
    value: v.id,
    label: v.name,
  }));
  const batchOptions = ((batches.data?.data ?? []) as VaccineBatchResponse[]).map((b) => ({
    value: b.id,
    label: b.batchNo,
  }));
  const diseaseOptions = ((diseases.data?.data ?? []) as DiseaseResponse[]).map((d) => ({
    value: d.id,
    label: d.name,
  }));
  const vetOptions = ((users.data ?? []) as UserSummary[]).map((u) => ({
    value: u.id,
    label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username,
  }));

  // -- List queries --
  const diseasesQ = useQuery(trpc.health.listDiseases.queryOptions({ limit: PAGE_SIZE }));
  const vaccinesQ = useQuery(trpc.health.listVaccines.queryOptions({ limit: PAGE_SIZE }));
  const batchesQ = useQuery(trpc.health.listBatches.queryOptions({ limit: PAGE_SIZE }));
  const vaccinationsQ = useQuery(trpc.health.listVaccinations.queryOptions({ limit: PAGE_SIZE }));
  const treatmentsQ = useQuery(trpc.health.listTreatments.queryOptions({ limit: PAGE_SIZE }));
  const labTestsQ = useQuery(trpc.health.listLabTests.queryOptions({ limit: PAGE_SIZE }));

  // -- Mutations --
  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const createDisease = useMutation(trpc.health.createDisease.mutationOptions({ onSuccess: () => invalidate(trpc.health.listDiseases.queryKey()) }));
  const createVaccine = useMutation(trpc.health.createVaccine.mutationOptions({ onSuccess: () => invalidate(trpc.health.listVaccines.queryKey()) }));
  const createBatch = useMutation(trpc.health.createVaccineBatch.mutationOptions({ onSuccess: () => invalidate(trpc.health.listBatches.queryKey()) }));
  const recordVaccination = useMutation(trpc.health.recordVaccination.mutationOptions({ onSuccess: () => invalidate(trpc.health.listVaccinations.queryKey()) }));
  const recordTreatment = useMutation(trpc.health.recordTreatment.mutationOptions({ onSuccess: () => invalidate(trpc.health.listTreatments.queryKey()) }));
  const recordLabTest = useMutation(trpc.health.recordLabTest.mutationOptions({ onSuccess: () => invalidate(trpc.health.listLabTests.queryKey()) }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Health" description="Diseases, vaccines, vaccinations, treatments, and lab tests." />
      <Tabs defaultValue="diseases" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="diseases">Diseases</TabsTrigger>
          <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="labTests">Lab tests</TabsTrigger>
        </TabsList>

        <TabsContent value="diseases">
          <DataTable
            columns={diseaseColumns()}
            data={(diseasesQ.data?.data ?? []) as DiseaseResponse[]}
            total={diseasesQ.data?.total ?? 0}
            isLoading={diseasesQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="New disease"
              schema={createDiseaseRequestSchema}
              mutation={createDisease}
              title="New disease"
              description="Register a notifiable or routine disease."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="name" label="Name" placeholder="e.g. Brucellosis" />
                  <SwitchField control={form.control} name="notifiable" label="Notifiable" />
                  <TextareaField control={form.control} name="description" label="Description" placeholder="Optional" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="vaccines">
          <DataTable
            columns={vaccineColumns()}
            data={(vaccinesQ.data?.data ?? []) as VaccineResponse[]}
            total={vaccinesQ.data?.total ?? 0}
            isLoading={vaccinesQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="New vaccine"
              schema={createVaccineRequestSchema}
              mutation={createVaccine}
              title="New vaccine"
              description="Register a vaccine in the catalog."
              fields={(form) => (
                <>
                  <TextField control={form.control} name="name" label="Name" placeholder="e.g. Bovilis" />
                  <TextField control={form.control} name="manufacturer" label="Manufacturer" placeholder="Optional" />
                  <SelectField
                    control={form.control}
                    name="type"
                    label="Type"
                    options={enumToOptions(Object.values(VACCINE_TYPE))}
                  />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="batches">
          <DataTable
            columns={vaccineBatchColumns({ vaccineLabel: (id) => vaccineMap.get(id)?.name ?? id })}
            data={(batchesQ.data?.data ?? []) as VaccineBatchResponse[]}
            total={batchesQ.data?.total ?? 0}
            isLoading={batchesQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="New batch"
              schema={createVaccineBatchRequestSchema}
              mutation={createBatch}
              title="New vaccine batch"
              description="Register a received vaccine batch (stock tracked)."
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="vaccineId" label="Vaccine" placeholder="Search vaccines…" options={vaccineOptions} />
                  <TextField control={form.control} name="batchNo" label="Batch no" placeholder="e.g. B-2026-001" />
                  <DateField control={form.control} name="productionDate" label="Production date" />
                  <DateField control={form.control} name="expiryDate" label="Expiry date" />
                  <NumberField control={form.control} name="quantityReceived" label="Quantity received" placeholder="100" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="vaccinations">
          <DataTable
            columns={vaccinationColumns({
              animalLabel,
              vaccineLabel: (id) => vaccineMap.get(id)?.name ?? id,
              batchLabel: (id) => (id ? (batchMap.get(id)?.batchNo ?? id) : "—"),
              vetLabel: (id) => (id ? (userMap.get(id) ? `${userMap.get(id)!.firstName ?? ""} ${userMap.get(id)!.lastName ?? ""}`.trim() || userMap.get(id)!.username : id) : "—"),
            })}
            data={(vaccinationsQ.data?.data ?? []) as VaccinationResponse[]}
            total={vaccinationsQ.data?.total ?? 0}
            isLoading={vaccinationsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Record vaccination"
              schema={recordVaccinationRequestSchema}
              mutation={recordVaccination}
              title="Record vaccination"
              description="Vet-authorized vaccination event."
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="animalId" label="Animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <ComboboxField control={form.control} name="vaccineId" label="Vaccine" placeholder="Search vaccines…" options={vaccineOptions} />
                  <ComboboxField control={form.control} name="batchId" label="Batch" placeholder="Search batches…" options={batchOptions} />
                  <ComboboxField control={form.control} name="vetId" label="Vet" placeholder="Search vets…" options={vetOptions} />
                  <DateField control={form.control} name="adminDate" label="Administration date" />
                  <SelectField
                    control={form.control}
                    name="route"
                    label="Route"
                    options={enumToOptions(administrationRouteSchema.options as readonly string[])}
                  />
                  <TextareaField control={form.control} name="notes" label="Notes" placeholder="Optional" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="treatments">
          <DataTable
            columns={treatmentColumns({
              animalLabel,
              diseaseLabel: (id) => (id ? (diseaseMap.get(id)?.name ?? id) : "—"),
              vetLabel: (id) => (id ? (userMap.get(id) ? `${userMap.get(id)!.firstName ?? ""} ${userMap.get(id)!.lastName ?? ""}`.trim() || userMap.get(id)!.username : id) : "—"),
            })}
            data={(treatmentsQ.data?.data ?? []) as TreatmentResponse[]}
            total={treatmentsQ.data?.total ?? 0}
            isLoading={treatmentsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Record treatment"
              schema={recordTreatmentRequestSchema}
              mutation={recordTreatment}
              title="Record treatment"
              description="Vet-authorized treatment / diagnosis event."
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="animalId" label="Animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <ComboboxField control={form.control} name="diseaseId" label="Disease" placeholder="Search diseases…" options={diseaseOptions} />
                  <ComboboxField control={form.control} name="vetId" label="Vet" placeholder="Search vets…" options={vetOptions} />
                  <DateField control={form.control} name="diagnosisDate" label="Diagnosis date" />
                  <TextareaField control={form.control} name="treatmentDesc" label="Treatment description" placeholder="Optional" />
                  <SwitchField control={form.control} name="isolated" label="Isolated" />
                </>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="labTests">
          <DataTable
            columns={labTestColumns({
              animalLabel,
              diseaseLabel: (id) => (id ? (diseaseMap.get(id)?.name ?? id) : "—"),
            })}
            data={(labTestsQ.data?.data ?? []) as LabTestResponse[]}
            total={labTestsQ.data?.total ?? 0}
            isLoading={labTestsQ.isLoading}
            page={0}
            pageSize={PAGE_SIZE}
          />
          <div className="mt-4">
            <ActionDialog
              triggerLabel="Record lab test"
              schema={recordLabTestRequestSchema}
              mutation={recordLabTest}
              title="Record lab test"
              description="Laboratory test result for an animal."
              fields={(form) => (
                <>
                  <ComboboxField control={form.control} name="animalId" label="Animal" placeholder="Search animals…" options={animalOptions} />
                  <ComboboxField control={form.control} name="farmId" label="Farm" placeholder="Search farms…" options={farmOptions} />
                  <ComboboxField control={form.control} name="diseaseId" label="Disease" placeholder="Search diseases…" options={diseaseOptions} />
                  <SelectField control={form.control} name="testType" label="Test type" options={enumToOptions(Object.values(TEST_TYPE))} />
                  <SelectField control={form.control} name="result" label="Result" options={enumToOptions(Object.values(TEST_RESULT))} />
                  <TextField control={form.control} name="testMethod" label="Method" placeholder="Optional" />
                  <TextField control={form.control} name="labName" label="Lab name" placeholder="Optional" />
                  <TextField control={form.control} name="labSampleId" label="Sample id" placeholder="Optional" />
                  <DateField control={form.control} name="sampleDate" label="Sample date" />
                  <DateField control={form.control} name="resultDate" label="Result date" />
                  <NumberField control={form.control} name="resultNumeric" label="Numeric result" placeholder="Optional" />
                  <TextField control={form.control} name="resultUnit" label="Unit" placeholder="Optional" />
                  <TextField control={form.control} name="certificateRef" label="Certificate ref" placeholder="Optional" />
                  <TextareaField control={form.control} name="interpretation" label="Interpretation" placeholder="Optional" />
                </>
              )}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
