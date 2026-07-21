"use client";

import { Button } from "@rocky/ui/components/button";
import { Card, CardContent } from "@rocky/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rocky/ui/components/dialog";
import { DropdownMenuItem } from "@rocky/ui/components/dropdown-menu";
import { Input } from "@rocky/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rocky/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rocky/ui/components/tabs";
import {
  type AnimalSummary,
  createDiseaseRequestSchema,
  createVaccineBatchRequestSchema,
  createVaccineRequestSchema,
  type DiseaseResponse,
  type FarmResponse,
  type LabTestResponse,
  recordLabTestRequestSchema,
  recordTreatmentRequestSchema,
  recordVaccinationRequestSchema,
  type TreatmentResponse,
  type UserSummary,
  updateDiseaseRequestSchema,
  type VaccinationResponse,
  type VaccineBatchResponse,
  type VaccineDiseaseResponse,
  type VaccineResponse,
} from "@rocky/validators/api";
import { administrationRouteSchema, TEST_RESULT, TEST_TYPE, VACCINE_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import {
  diseaseColumns,
  labTestColumns,
  treatmentColumns,
  vaccinationColumns,
  vaccineBatchColumns,
  vaccineColumns,
} from "#components/health/columns";
import { ActionDialog, RowActionMenu } from "#components/shared/action-dialog";
import { DataTable } from "#components/shared/data-table";
import {
  ComboboxField,
  DateField,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { type DetailField, RowDetailsDialog } from "#components/shared/row-details-dialog";
import { Timeline, type TimelineItem } from "#components/shared/timeline";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

const PAGE_SIZE = 20;

/** Debounce a fast-changing value (e.g. search input) before it hits the API. */
function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

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
  ((animals.data?.data ?? []) as AnimalSummary[]).forEach((a) => {
    animalMap.set(a.id, a);
  });
  const farmMap = new Map<string, FarmResponse>();
  ((farms.data?.data ?? []) as FarmResponse[]).forEach((f) => {
    farmMap.set(f.id, f);
  });
  const vaccineMap = new Map<string, VaccineResponse>();
  ((vaccines.data?.data ?? []) as VaccineResponse[]).forEach((v) => {
    vaccineMap.set(v.id, v);
  });
  const batchMap = new Map<string, VaccineBatchResponse>();
  ((batches.data?.data ?? []) as VaccineBatchResponse[]).forEach((b) => {
    batchMap.set(b.id, b);
  });
  const diseaseMap = new Map<string, DiseaseResponse>();
  ((diseases.data?.data ?? []) as DiseaseResponse[]).forEach((d) => {
    diseaseMap.set(d.id, d);
  });
  const userMap = new Map<string, UserSummary>();
  ((users.data ?? []) as UserSummary[]).forEach((u) => {
    userMap.set(u.id, u);
  });

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

  // -- List queries (paginated tables; reference lookups above feed the maps) --
  const batchesQ = useQuery(trpc.health.listBatches.queryOptions({ limit: PAGE_SIZE }));
  const vaccinationsQ = useQuery(trpc.health.listVaccinations.queryOptions({ limit: PAGE_SIZE }));
  const treatmentsQ = useQuery(trpc.health.listTreatments.queryOptions({ limit: PAGE_SIZE }));
  const labTestsQ = useQuery(trpc.health.listLabTests.queryOptions({ limit: PAGE_SIZE }));

  // -- Mutations --
  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const createDisease = useMutation(
    trpc.health.createDisease.mutationOptions({ onSuccess: () => invalidate(trpc.health.listDiseases.queryKey()) }),
  );
  const createVaccine = useMutation(
    trpc.health.createVaccine.mutationOptions({ onSuccess: () => invalidate(trpc.health.listVaccines.queryKey()) }),
  );
  const createBatch = useMutation(
    trpc.health.createVaccineBatch.mutationOptions({ onSuccess: () => invalidate(trpc.health.listBatches.queryKey()) }),
  );
  const recordVaccination = useMutation(
    trpc.health.recordVaccination.mutationOptions({
      onSuccess: () => invalidate(trpc.health.listVaccinations.queryKey()),
    }),
  );
  const recordTreatment = useMutation(
    trpc.health.recordTreatment.mutationOptions({ onSuccess: () => invalidate(trpc.health.listTreatments.queryKey()) }),
  );
  const recordLabTest = useMutation(
    trpc.health.recordLabTest.mutationOptions({ onSuccess: () => invalidate(trpc.health.listLabTests.queryKey()) }),
  );

  // -- Clinical record (animal-scoped Timeline) --
  const [selectedAnimal, setSelectedAnimal] = React.useState<string | null>(null);
  const clinicalVacc = useQuery(
    trpc.health.listVaccinations.queryOptions(
      { animalId: selectedAnimal ?? undefined, limit: 200 },
      { enabled: !!selectedAnimal },
    ),
  );
  const clinicalTreat = useQuery(
    trpc.health.listTreatments.queryOptions(
      { animalId: selectedAnimal ?? undefined, limit: 200 },
      { enabled: !!selectedAnimal },
    ),
  );
  const clinicalLab = useQuery(
    trpc.health.listLabTests.queryOptions(
      { animalId: selectedAnimal ?? undefined, limit: 200 },
      { enabled: !!selectedAnimal },
    ),
  );

  const clinicalEvents = [
    ...((clinicalVacc.data?.data ?? []) as VaccinationResponse[]).map((v) => ({
      id: `vacc-${v.id}`,
      date: new Date(v.adminDate),
      title: "Vaccination",
      description: vaccineMap.get(v.vaccineId)?.name ?? v.vaccineId,
    })),
    ...((clinicalTreat.data?.data ?? []) as TreatmentResponse[]).map((t) => ({
      id: `treat-${t.id}`,
      date: new Date(t.diagnosisDate),
      title: "Treatment",
      description: t.treatmentDesc || (t.diseaseId ? diseaseMap.get(t.diseaseId)?.name : undefined),
    })),
    ...((clinicalLab.data?.data ?? []) as LabTestResponse[]).map((l) => ({
      id: `lab-${l.id}`,
      date: new Date(l.resultDate ?? l.sampleDate),
      title: "Lab test",
      description: l.result,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const clinicalItems: TimelineItem[] = clinicalEvents.map((e, i) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    status: i === 0 ? "current" : "done",
  }));

  // -- Disease tab: search + status filter (wired to the real API) --
  const [diseaseSearch, setDiseaseSearch] = React.useState("");
  const [diseaseFilter, setDiseaseFilter] = React.useState<"all" | "notifiable" | "routine">("all");
  const debouncedDiseaseSearch = useDebounced(diseaseSearch);
  const diseaseQuery = useQuery(
    trpc.health.listDiseases.queryOptions({
      limit: PAGE_SIZE,
      search: debouncedDiseaseSearch || undefined,
      notifiable: diseaseFilter === "all" ? undefined : diseaseFilter === "notifiable",
    }),
  );

  // -- Vaccine tab: search + type filter (wired to the real API) --
  const [vaccineSearch, setVaccineSearch] = React.useState("");
  const [vaccineType, setVaccineType] = React.useState<string>("all");
  const debouncedVaccineSearch = useDebounced(vaccineSearch);
  const vaccineQuery = useQuery(
    trpc.health.listVaccines.queryOptions({
      limit: PAGE_SIZE,
      search: debouncedVaccineSearch || undefined,
      type: vaccineType === "all" ? undefined : (vaccineType as (typeof VACCINE_TYPE)[keyof typeof VACCINE_TYPE]),
    }),
  );

  // -- Dense, contained data table shared across tabs --
  const tableClass = "[&_td]:!py-3 [&_th]:!py-3";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Health" description="Manage epidemiological master data and field records." />

      <Tabs defaultValue="diseases" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="diseases">Diseases</TabsTrigger>
          <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="labTests">Lab tests</TabsTrigger>
          <TabsTrigger value="clinical">Clinical record</TabsTrigger>
        </TabsList>

        <TabsContent value="diseases">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={diseaseSearch}
                    onChange={(e) => setDiseaseSearch(e.target.value)}
                    placeholder="Search diseases…"
                    className="pl-8"
                  />
                </div>
                <Select value={diseaseFilter} onValueChange={(v) => setDiseaseFilter(v as typeof diseaseFilter)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="notifiable">Notifiable</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ActionDialog
                triggerLabel="New disease"
                icon={PlusIcon}
                schema={createDiseaseRequestSchema}
                mutation={createDisease}
                title="New disease"
                description="Register a notifiable or routine disease."
                fields={(form) => (
                  <>
                    <TextField control={form.control} name="name" label="Name" placeholder="e.g. Brucellosis" />
                    <SwitchField control={form.control} name="notifiable" label="Notifiable" />
                    <TextareaField
                      control={form.control}
                      name="description"
                      label="Description"
                      placeholder="Optional"
                    />
                  </>
                )}
              />
            </div>
            <CardContent>
              <DataTable
                columns={diseaseColumns({ rowActions: (disease) => <DiseaseRowActions disease={disease} /> })}
                data={(diseaseQuery.data?.data ?? []) as DiseaseResponse[]}
                total={diseaseQuery.data?.total ?? 0}
                isLoading={diseaseQuery.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccines">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={vaccineSearch}
                    onChange={(e) => setVaccineSearch(e.target.value)}
                    placeholder="Search vaccines…"
                    className="pl-8"
                  />
                </div>
                <Select value={vaccineType} onValueChange={setVaccineType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {enumToOptions(Object.values(VACCINE_TYPE)).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ActionDialog
                triggerLabel="New vaccine"
                icon={PlusIcon}
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
            <CardContent>
              <DataTable
                columns={vaccineColumns({
                  rowActions: (v) => (
                    <RowActionMenu
                      items={[
                        { type: "dialog", dialog: <VaccineDetails vaccine={v} /> },
                        {
                          type: "dialog",
                          dialog: (
                            <VaccineDiseaseManager
                              vaccine={v}
                              diseaseOptions={diseaseOptions}
                              diseaseMap={diseaseMap}
                            />
                          ),
                        },
                      ]}
                    />
                  ),
                })}
                data={(vaccineQuery.data?.data ?? []) as VaccineResponse[]}
                total={vaccineQuery.data?.total ?? 0}
                isLoading={vaccineQuery.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <div className="flex flex-wrap items-center justify-end gap-2 border-b px-4 py-3">
              <ActionDialog
                triggerLabel="New batch"
                icon={PlusIcon}
                schema={createVaccineBatchRequestSchema}
                mutation={createBatch}
                title="New vaccine batch"
                description="Register a received vaccine batch (stock tracked)."
                fields={(form) => (
                  <>
                    <ComboboxField
                      control={form.control}
                      name="vaccineId"
                      label="Vaccine"
                      placeholder="Search vaccines…"
                      options={vaccineOptions}
                    />
                    <TextField control={form.control} name="batchNo" label="Batch no" placeholder="e.g. B-2026-001" />
                    <DateField control={form.control} name="productionDate" label="Production date" />
                    <DateField control={form.control} name="expiryDate" label="Expiry date" />
                    <NumberField
                      control={form.control}
                      name="quantityReceived"
                      label="Quantity received"
                      placeholder="100"
                    />
                  </>
                )}
              />
            </div>
            <CardContent>
              <DataTable
                columns={vaccineBatchColumns({
                  vaccineLabel: (id) => vaccineMap.get(id)?.name ?? id,
                  rowActions: (b) => (
                    <RowActionMenu items={[{ type: "dialog", dialog: <VaccineBatchDetails batch={b} /> }]} />
                  ),
                })}
                data={(batchesQ.data?.data ?? []) as VaccineBatchResponse[]}
                total={batchesQ.data?.total ?? 0}
                isLoading={batchesQ.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccinations">
          <Card>
            <div className="flex flex-wrap items-center justify-end gap-2 border-b px-4 py-3">
              <ActionDialog
                triggerLabel="Record vaccination"
                icon={PlusIcon}
                schema={recordVaccinationRequestSchema}
                mutation={recordVaccination}
                title="Record vaccination"
                description="Vet-authorized vaccination event."
                fields={(form) => (
                  <>
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
                    <ComboboxField
                      control={form.control}
                      name="vaccineId"
                      label="Vaccine"
                      placeholder="Search vaccines…"
                      options={vaccineOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="batchId"
                      label="Batch"
                      placeholder="Search batches…"
                      options={batchOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="vetId"
                      label="Vet"
                      placeholder="Search vets…"
                      options={vetOptions}
                    />
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
            <CardContent>
              <DataTable
                columns={vaccinationColumns({
                  animalLabel,
                  vaccineLabel: (id) => vaccineMap.get(id)?.name ?? id,
                  batchLabel: (id) => (id ? (batchMap.get(id)?.batchNo ?? id) : "—"),
                  vetLabel: (id) => {
                    if (!id) return "—";
                    const u = userMap.get(id);
                    return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username : id;
                  },
                  rowActions: (v) => (
                    <RowActionMenu items={[{ type: "dialog", dialog: <VaccinationDetails row={v} /> }]} />
                  ),
                })}
                data={(vaccinationsQ.data?.data ?? []) as VaccinationResponse[]}
                total={vaccinationsQ.data?.total ?? 0}
                isLoading={vaccinationsQ.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <div className="flex flex-wrap items-center justify-end gap-2 border-b px-4 py-3">
              <ActionDialog
                triggerLabel="Record treatment"
                icon={PlusIcon}
                schema={recordTreatmentRequestSchema}
                mutation={recordTreatment}
                title="Record treatment"
                description="Vet-authorized treatment / diagnosis event."
                fields={(form) => (
                  <>
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
                    <ComboboxField
                      control={form.control}
                      name="diseaseId"
                      label="Disease"
                      placeholder="Search diseases…"
                      options={diseaseOptions}
                    />
                    <ComboboxField
                      control={form.control}
                      name="vetId"
                      label="Vet"
                      placeholder="Search vets…"
                      options={vetOptions}
                    />
                    <DateField control={form.control} name="diagnosisDate" label="Diagnosis date" />
                    <TextareaField
                      control={form.control}
                      name="treatmentDesc"
                      label="Treatment description"
                      placeholder="Optional"
                    />
                    <SwitchField control={form.control} name="isolated" label="Isolated" />
                  </>
                )}
              />
            </div>
            <CardContent>
              <DataTable
                columns={treatmentColumns({
                  animalLabel,
                  diseaseLabel: (id) => (id ? (diseaseMap.get(id)?.name ?? id) : "—"),
                  vetLabel: (id) => {
                    if (!id) return "—";
                    const u = userMap.get(id);
                    return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username : id;
                  },
                  rowActions: (t) => (
                    <RowActionMenu items={[{ type: "dialog", dialog: <TreatmentDetails row={t} /> }]} />
                  ),
                })}
                data={(treatmentsQ.data?.data ?? []) as TreatmentResponse[]}
                total={treatmentsQ.data?.total ?? 0}
                isLoading={treatmentsQ.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labTests">
          <Card>
            <div className="flex flex-wrap items-center justify-end gap-2 border-b px-4 py-3">
              <ActionDialog
                triggerLabel="Record lab test"
                icon={PlusIcon}
                schema={recordLabTestRequestSchema}
                mutation={recordLabTest}
                title="Record lab test"
                description="Laboratory test result for an animal."
                fields={(form) => (
                  <>
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
                    <ComboboxField
                      control={form.control}
                      name="diseaseId"
                      label="Disease"
                      placeholder="Search diseases…"
                      options={diseaseOptions}
                    />
                    <SelectField
                      control={form.control}
                      name="testType"
                      label="Test type"
                      options={enumToOptions(Object.values(TEST_TYPE))}
                    />
                    <SelectField
                      control={form.control}
                      name="result"
                      label="Result"
                      options={enumToOptions(Object.values(TEST_RESULT))}
                    />
                    <TextField control={form.control} name="testMethod" label="Method" placeholder="Optional" />
                    <TextField control={form.control} name="labName" label="Lab name" placeholder="Optional" />
                    <TextField control={form.control} name="labSampleId" label="Sample id" placeholder="Optional" />
                    <DateField control={form.control} name="sampleDate" label="Sample date" />
                    <DateField control={form.control} name="resultDate" label="Result date" />
                    <NumberField
                      control={form.control}
                      name="resultNumeric"
                      label="Numeric result"
                      placeholder="Optional"
                    />
                    <TextField control={form.control} name="resultUnit" label="Unit" placeholder="Optional" />
                    <TextField
                      control={form.control}
                      name="certificateRef"
                      label="Certificate ref"
                      placeholder="Optional"
                    />
                    <TextareaField
                      control={form.control}
                      name="interpretation"
                      label="Interpretation"
                      placeholder="Optional"
                    />
                  </>
                )}
              />
            </div>
            <CardContent>
              <DataTable
                columns={labTestColumns({
                  animalLabel,
                  diseaseLabel: (id) => (id ? (diseaseMap.get(id)?.name ?? id) : "—"),
                  rowActions: (l) => <RowActionMenu items={[{ type: "dialog", dialog: <LabTestDetails row={l} /> }]} />,
                })}
                data={(labTestsQ.data?.data ?? []) as LabTestResponse[]}
                total={labTestsQ.data?.total ?? 0}
                isLoading={labTestsQ.isLoading}
                page={0}
                pageSize={PAGE_SIZE}
                bordered={false}
                tableClassName={tableClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical">
          <div className="flex flex-col gap-4">
            <select
              value={selectedAnimal ?? ""}
              onChange={(e) => setSelectedAnimal(e.target.value || null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select animal…</option>
              {animalOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {selectedAnimal ? (
              clinicalItems.length > 0 ? (
                <Timeline items={clinicalItems} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No vaccination, treatment, or lab-test records for this animal.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Select an animal to view its clinical timeline.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Disease row actions (Edit + View details) ──

function DiseaseRowActions({ disease }: { disease: DiseaseResponse }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateDisease = useMutation(
    trpc.health.updateDisease.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.health.listDiseases.queryKey() }),
    }),
  );

  return (
    <RowActionMenu
      items={[
        {
          type: "dialog",
          dialog: (
            <ActionDialog
              as="menuitem"
              triggerLabel="Edit"
              icon={PencilIcon}
              schema={updateDiseaseRequestSchema}
              mutation={updateDisease}
              title="Edit disease"
              description="Update disease master data."
              defaultValues={{
                id: disease.id,
                name: disease.name,
                notifiable: disease.notifiable,
                quarantineDays: disease.quarantineDays ?? null,
                description: disease.description ?? "",
              }}
              fields={(form) => (
                <>
                  <TextField control={form.control} name="name" label="Name" placeholder="e.g. Brucellosis" />
                  <SwitchField control={form.control} name="notifiable" label="Notifiable" />
                  <NumberField control={form.control} name="quarantineDays" label="Quarantine (days)" placeholder="0" />
                  <TextareaField control={form.control} name="description" label="Description" placeholder="Optional" />
                </>
              )}
            />
          ),
        },
        {
          type: "dialog",
          dialog: (
            <RowDetailsDialog
              title={disease.name}
              description="Disease master record"
              fields={[
                { label: "Name", value: disease.name },
                { label: "Notifiable", value: disease.notifiable ? "Yes" : "No" },
                { label: "Quarantine (days)", value: disease.quarantineDays ?? "—" },
                { label: "Description", value: disease.description || "—" },
                { label: "Created", value: new Date(disease.createdAt).toLocaleDateString() },
              ]}
            />
          ),
        },
      ]}
    />
  );
}

// ── Read-only detail inspectors (one per entity) ──

function VaccineDetails({ vaccine }: { vaccine: VaccineResponse }) {
  const fields: DetailField[] = [
    { label: "Name", value: vaccine.name },
    { label: "Manufacturer", value: vaccine.manufacturer || "—" },
    { label: "Type", value: vaccine.type },
    { label: "Created", value: new Date(vaccine.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title={vaccine.name} description="Vaccine master record" fields={fields} />;
}

// ── Vaccine ↔ disease linking (closes health.GetVaccineDiseases / Link / Unlink parity gaps) ──

function VaccineDiseaseManager({
  vaccine,
  diseaseOptions,
  diseaseMap,
}: {
  vaccine: VaccineResponse;
  diseaseOptions: { value: string; label: string }[];
  diseaseMap: Map<string, DiseaseResponse>;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const linked = useQuery(trpc.health.getVaccineDiseases.queryOptions({ vaccineId: vaccine.id }));
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.health.getVaccineDiseases.queryKey({ vaccineId: vaccine.id }) });
  const link = useMutation(trpc.health.linkVaccineDisease.mutationOptions({ onSuccess: invalidate }));
  const unlink = useMutation(trpc.health.unlinkVaccineDisease.mutationOptions({ onSuccess: invalidate }));
  const [open, setOpen] = React.useState(false);
  const [diseaseId, setDiseaseId] = React.useState<string>("");

  const linkedRows = (linked.data ?? []) as VaccineDiseaseResponse[];

  return (
    <>
      <DropdownMenuItem onSelect={() => setOpen(true)}>Manage diseases</DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disease coverage · {vaccine.name}</DialogTitle>
            <DialogDescription>Link notifiable or routine diseases this vaccine protects against.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={diseaseId} onValueChange={setDiseaseId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose disease…" />
                </SelectTrigger>
                <SelectContent>
                  {diseaseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!diseaseId || link.isPending}
                onClick={() => {
                  if (!diseaseId) return;
                  link.mutate({ vaccineId: vaccine.id, diseaseId });
                  setDiseaseId("");
                }}
              >
                Link
              </Button>
            </div>
            <ul className="flex flex-col gap-1">
              {linkedRows.length === 0 ? (
                <li className="text-sm text-muted-foreground">No linked diseases yet.</li>
              ) : (
                linkedRows.map((d) => (
                  <li
                    key={d.diseaseId}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{diseaseMap.get(d.diseaseId)?.name ?? d.diseaseId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={unlink.isPending}
                      onClick={() => unlink.mutate({ vaccineId: vaccine.id, diseaseId: d.diseaseId })}
                    >
                      Unlink
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VaccineBatchDetails({ batch }: { batch: VaccineBatchResponse }) {
  const fields: DetailField[] = [
    { label: "Batch no", value: batch.batchNo },
    { label: "Produced", value: batch.productionDate ? new Date(batch.productionDate).toLocaleDateString() : "—" },
    { label: "Expires", value: batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—" },
    { label: "Received", value: batch.quantityReceived },
    { label: "Remaining", value: batch.quantityRemaining },
    { label: "Created", value: new Date(batch.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title={`Batch ${batch.batchNo}`} description="Vaccine batch" fields={fields} />;
}

function VaccinationDetails({ row }: { row: VaccinationResponse }) {
  const fields: DetailField[] = [
    { label: "Animal", value: row.animalId },
    { label: "Vaccine", value: row.vaccineId },
    { label: "Batch", value: row.batchId ?? "—" },
    { label: "Vet", value: row.vetId ?? "—" },
    { label: "Date", value: new Date(row.adminDate).toLocaleDateString() },
    { label: "Route", value: row.route },
    { label: "Created", value: new Date(row.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title="Vaccination" description="Vaccination event" fields={fields} />;
}

function TreatmentDetails({ row }: { row: TreatmentResponse }) {
  const fields: DetailField[] = [
    { label: "Animal", value: row.animalId },
    { label: "Disease", value: row.diseaseId ?? "—" },
    { label: "Vet", value: row.vetId ?? "—" },
    { label: "Diagnosed", value: new Date(row.diagnosisDate).toLocaleDateString() },
    { label: "Treatment", value: row.treatmentDesc || "—" },
    { label: "Isolated", value: row.isolated ? "Yes" : "No" },
    { label: "Created", value: new Date(row.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title="Treatment" description="Treatment event" fields={fields} />;
}

function LabTestDetails({ row }: { row: LabTestResponse }) {
  const fields: DetailField[] = [
    { label: "Animal", value: row.animalId },
    { label: "Disease", value: row.diseaseId ?? "—" },
    { label: "Test", value: row.testType },
    { label: "Result", value: row.result },
    { label: "Sampled", value: new Date(row.sampleDate).toLocaleDateString() },
    { label: "Resulted", value: row.resultDate ? new Date(row.resultDate).toLocaleDateString() : "—" },
    { label: "Created", value: new Date(row.createdAt).toLocaleDateString() },
  ];
  return <RowDetailsDialog title="Lab test" description="Lab test result" fields={fields} />;
}
