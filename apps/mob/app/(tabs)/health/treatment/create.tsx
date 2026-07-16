import { View, ScrollView, Alert, Switch } from "react-native";
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
import { recordTreatmentRequestSchema } from "@rocky/validators/api";
import { notifySuccess } from "@/lib/notify";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Rebuild the form schema from the canonical API schema's `.shape` (single
// source of truth). `vetId` is a server/context value (hardcoded to the acting
// vet below) — omitted from the client form. `diseaseId` is optional on the
// server, so it is accepted as an empty string here and resolved to `null` at
// submit. Zod 4: `.omit()` rejects objects that carry `.refine()` checks, so we
// rebuild from `.shape`.
const createTreatmentFormSchema = z
  .object(recordTreatmentRequestSchema.shape)
  .omit({ vetId: true })
  .extend({
    diseaseId: z.string(),
    diagnosisDate: z.string().min(1, "Diagnosis date is required"),
  });

type TreatmentForm = {
  animalId: string;
  farmId: string;
  diseaseId: string;
  diagnosisDate: string;
  treatmentDesc: string;
  isolated: boolean;
};

export default function TreatmentScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueTreatment = useOfflineMutation("treatment");
  const canWriteHealth = useCan("health:write");

  // Data-backed picker for disease (replaces the raw UUID input).
  const { data: diseases } = trpc.health.listDiseases.useQuery({ limit: 50, offset: 0 });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TreatmentForm>({
    resolver: zodResolver(createTreatmentFormSchema) as Resolver<TreatmentForm>,
    mode: "onTouched",
    defaultValues: {
      animalId: "",
      farmId: "",
      diseaseId: "",
      diagnosisDate: "",
      treatmentDesc: "",
      isolated: false,
    },
  });

  const recordTreatment = trpc.health.recordTreatment.useMutation({
    onSuccess: () => {
      // The server flags the farm for inspection when the recorded disease is
      // notifiable; surface that feedback to the field vet (WO-095).
      notifySuccess("Notifiable disease recorded — farm flagged for inspection");
      utils.health.listTreatments.invalidate();
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
      diseaseId: values.diseaseId || null,
      vetId: "00000000-0000-0000-0000-000000000000",
      diagnosisDate: values.diagnosisDate,
      treatmentDesc: values.treatmentDesc || undefined,
      isolated: values.isolated,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The outbox drains on
      // reconnect via OfflineProvider; the Server re-validates @Policy + RLS.
      if (deviceId) {
        void enqueueTreatment(payload);
        // The farm is flagged for inspection when the disease is notifiable;
        // the client only holds the diseaseId (a UUID) and cannot resolve
        // notifiability locally, so the toast fires on every offline enqueue
        // (see WO-095 report for the assumption).
        notifySuccess("Notifiable disease recorded — farm flagged for inspection");
      }
      utils.health.listTreatments.invalidate();
      router.back();
      return;
    }
    recordTreatment.mutate(payload);
  });

  const diseaseId = watch("diseaseId");

  return (
    <ScrollView className="flex-1 bg-background">
      <Card className="m-4">
        <CardContent className="gap-4 p-4">
          <FormField label="Animal" error={errors.animalId?.message} nativeID="animal">
            <AnimalPicker onSelect={(a) => setValue("animalId", a.id, { shouldValidate: true })} />
          </FormField>

          <FormField label="Farm" error={errors.farmId?.message} nativeID="farm">
            <FarmPicker onSelect={(f) => setValue("farmId", f.id, { shouldValidate: true })} />
          </FormField>

          <FormField label="Disease (optional)" error={errors.diseaseId?.message} nativeID="diseaseId">
            <Select
              value={
                diseases?.data && diseaseId
                  ? { value: diseaseId, label: diseases.data.find((d) => d.id === diseaseId)?.name ?? "" }
                  : undefined
              }
              onValueChange={(opt) => setValue("diseaseId", opt?.value ?? "", { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disease..." />
              </SelectTrigger>
              <SelectContent>
                {(diseases?.data ?? []).map((d) => (
                  <SelectItem key={d.id} label={d.name} value={d.id} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Diagnosis Date (YYYY-MM-DD)" error={errors.diagnosisDate?.message} nativeID="diagnosisDate">
            <Input
              placeholder="2026-01-15"
              value={watch("diagnosisDate")}
              onChangeText={(t) => setValue("diagnosisDate", t, { shouldValidate: true })}
            />
          </FormField>

          <FormField
            label="Treatment Description (optional)"
            error={errors.treatmentDesc?.message}
            nativeID="treatmentDesc"
          >
            <Input
              placeholder="Describe the treatment"
              value={watch("treatmentDesc")}
              onChangeText={(t) => setValue("treatmentDesc", t, { shouldValidate: true })}
            />
          </FormField>

          <View className="flex-row items-center justify-between">
            <Text>Isolated</Text>
            <Switch
              value={watch("isolated")}
              onValueChange={(v) => setValue("isolated", v, { shouldValidate: true })}
            />
          </View>

          {!canWriteHealth ? (
            <Text className="text-sm text-muted-foreground">You don't have permission to record health events.</Text>
          ) : !onlineManager.isOnline() ? (
            <Text className="text-sm text-muted-foreground">
              Offline — the treatment is saved locally and syncs when you reconnect.
            </Text>
          ) : null}

          <Button onPress={onSubmit} disabled={isSubmitting || !canWriteHealth} size="lg">
            <Text>Record Treatment</Text>
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
