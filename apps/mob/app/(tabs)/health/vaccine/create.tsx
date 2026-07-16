import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { trpc } from "@/providers/trpc-provider";
import { onlineManager } from "@tanstack/react-query";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useOffline } from "@/providers/offline-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { ADMIN_ROUTE } from "@rocky/validators/enums";
import type { administrationRouteType } from "@rocky/validators/enums";
import { recordVaccinationRequestSchema } from "@rocky/validators/api";
import { enumToOptions, titleCase } from "@/lib/enum-options";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ROUTE_OPTIONS = enumToOptions(ADMIN_ROUTE);

// Rebuild the form schema from the canonical API schema's `.shape` (single
// source of truth) so the UI projection stays in lockstep with the server.
// `vetId` is a server/context value (hardcoded to the acting vet below) — it is
// omitted from the client form. `adminDate` is adapted to a YYYY-MM-DD string
// input; the canonical "not in the future" rule is re-applied for client/server
// parity. Zod 4: `.omit()` rejects objects that carry `.refine()` checks, so we
// rebuild from `.shape` (no top-level checks) and re-add the refine.
const createVaccinationFormSchema = z
  .object(recordVaccinationRequestSchema.shape)
  .omit({ vetId: true })
  .extend({
    adminDate: z.string().min(1, "Administration date is required"),
    route: recordVaccinationRequestSchema.shape.route.optional(),
  })
  .refine(
    (data) => {
      if (data.adminDate) {
        const d = new Date(data.adminDate);
        if (d instanceof Date && d > new Date()) return false;
      }
      return true;
    },
    { message: "Administration date cannot be in the future" },
  );

type VaccinationForm = {
  animalId: string;
  farmId: string;
  vaccineId: string;
  batchId: string;
  route: administrationRouteType | undefined;
  adminDate: string;
  notes: string;
};

export default function VaccinationScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueVaccination = useOfflineMutation("vaccination");
  const canWriteHealth = useCan("health:write");

  // Data-backed pickers for vaccine + batch (replace raw UUID inputs).
  const { data: vaccines } = trpc.health.listVaccines.useQuery({ limit: 50, offset: 0 });
  const { data: batches } = trpc.health.listBatches.useQuery({ limit: 50, offset: 0 });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VaccinationForm>({
    resolver: zodResolver(createVaccinationFormSchema) as Resolver<VaccinationForm>,
    mode: "onTouched",
    defaultValues: {
      animalId: "",
      farmId: "",
      vaccineId: "",
      batchId: "",
      route: undefined,
      adminDate: "",
      notes: "",
    },
  });

  const recordVaccination = trpc.health.recordVaccination.useMutation({
    onSuccess: () => {
      utils.health.listVaccinations.invalidate();
      router.back();
    },
    onError: (e) => {
      Alert.alert("Error", e.message);
    },
  });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      animalId: values.animalId,
      farmId: values.farmId,
      vaccineId: values.vaccineId,
      batchId: values.batchId,
      vetId: "00000000-0000-0000-0000-000000000000",
      route: (values.route ?? ADMIN_ROUTE.INTRAMUSCULAR) as administrationRouteType,
      adminDate: values.adminDate,
      notes: values.notes || undefined,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The outbox drains on
      // reconnect via OfflineProvider; the Server re-validates @Policy + RLS.
      if (deviceId) void enqueueVaccination(payload);
      utils.health.listVaccinations.invalidate();
      router.back();
      return;
    }
    recordVaccination.mutate(payload);
  });

  const route = watch("route");
  const vaccineId = watch("vaccineId");
  const batchId = watch("batchId");

  return (
    <ScrollView className="flex-1 bg-background">
      <Card className="m-4">
        <CardContent className="gap-4 p-4">
          <FormField label="Animal" error={errors.animalId?.message} nativeID="animal">
            <AnimalPicker
              onSelect={(a) => {
                setValue("animalId", a.id, { shouldValidate: true });
              }}
            />
          </FormField>

          <FormField label="Farm" error={errors.farmId?.message} nativeID="farm">
            <FarmPicker
              onSelect={(f) => {
                setValue("farmId", f.id, { shouldValidate: true });
              }}
            />
          </FormField>

          <FormField label="Vaccine" error={errors.vaccineId?.message} nativeID="vaccineId">
            <Select
              value={
                vaccines?.data && vaccineId
                  ? { value: vaccineId, label: vaccines.data.find((v) => v.id === vaccineId)?.name ?? "" }
                  : undefined
              }
              onValueChange={(opt) => setValue("vaccineId", opt?.value ?? "", { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vaccine..." />
              </SelectTrigger>
              <SelectContent>
                {(vaccines?.data ?? []).map((v) => (
                  <SelectItem key={v.id} label={v.name} value={v.id} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Batch" error={errors.batchId?.message} nativeID="batchId">
            <Select
              value={
                batches?.data && batchId
                  ? { value: batchId, label: batches.data.find((b) => b.id === batchId)?.batchNo ?? "" }
                  : undefined
              }
              onValueChange={(opt) => setValue("batchId", opt?.value ?? "", { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch..." />
              </SelectTrigger>
              <SelectContent>
                {(batches?.data ?? []).map((b) => (
                  <SelectItem key={b.id} label={b.batchNo} value={b.id} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Administration Route" error={errors.route?.message} nativeID="route">
            <Select
              value={route ? { value: route, label: titleCase(route) } : undefined}
              onValueChange={(opt) =>
                setValue("route", (opt?.value ?? undefined) as administrationRouteType | undefined, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select route..." />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Administration Date (YYYY-MM-DD)" error={errors.adminDate?.message} nativeID="adminDate">
            <Input
              placeholder="2026-01-15"
              value={watch("adminDate")}
              onChangeText={(t) => setValue("adminDate", t, { shouldValidate: true })}
            />
          </FormField>

          <FormField label="Notes (optional)" error={errors.notes?.message} nativeID="notes">
            <Input
              placeholder="Any notes"
              value={watch("notes")}
              onChangeText={(t) => setValue("notes", t, { shouldValidate: true })}
            />
          </FormField>

          {!canWriteHealth ? (
            <Text className="text-sm text-muted-foreground">You don't have permission to record health events.</Text>
          ) : !onlineManager.isOnline() ? (
            <Text className="text-sm text-muted-foreground">
              Offline — the vaccination is saved locally and syncs when you reconnect.
            </Text>
          ) : null}

          <Button onPress={onSubmit} disabled={isSubmitting || !canWriteHealth} size="lg">
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Record Vaccination</Text>}
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
