import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { onlineManager } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc-provider";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useOffline } from "@/providers/offline-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { notifyError, notifySuccess } from "@/lib/notify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { recordDeathRequestSchema } from "@rocky/validators/api";
import { z } from "zod";

// Rebuilt from `recordDeathRequestSchema.shape` (single source of truth). All
// fields are string inputs; the picker-resolved ids are uuid strings.
const recordDeathFormSchema = z.object(recordDeathRequestSchema.shape);

type RecordDeathForm = z.infer<typeof recordDeathFormSchema>;

export default function DeathScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueDeath = useOfflineMutation("movement");
  const canRecordDeath = useCan("animal:death");

  const [animalLabel, setAnimalLabel] = useState("");
  const [farmLabel, setFarmLabel] = useState("");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordDeathForm>({
    resolver: zodResolver(recordDeathFormSchema) as Resolver<RecordDeathForm>,
    mode: "onTouched",
    defaultValues: {
      animalId: "",
      farmId: "",
      deathDate: "",
      deathCause: "",
    },
  });

  const recordDeath = trpc.movement.recordDeath.useMutation({
    onSuccess: () => {
      notifySuccess("Death recorded");
      utils.movement.list.invalidate();
      router.back();
    },
    onError: (error) => {
      notifyError(error);
    },
  });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      animalId: values.animalId,
      farmId: values.farmId,
      deathDate: values.deathDate,
      deathCause: values.deathCause,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The Server re-validates
      // @Policy + RLS on sync.
      if (deviceId) void enqueueDeath(payload);
      notifySuccess("Death saved locally — will sync when online");
      utils.movement.list.invalidate();
      router.back();
      return;
    }
    recordDeath.mutate(payload);
  });

  return (
    <ScrollView className="flex-1 bg-background">
    <Card className="m-4">
      <CardContent className="gap-4 p-4">
        <FormField label="Animal" error={errors.animalId?.message} nativeID="animal">
          <View className="gap-2">
            {watch("animalId") ? (
              <View className="bg-secondary p-3 rounded-md">
                <Text className="text-foreground font-medium">{animalLabel}</Text>
              </View>
            ) : null}
            <AnimalPicker
              onSelect={(a) => {
                setValue("animalId", a.id, { shouldValidate: true });
                setAnimalLabel(`${a.stateCode} ${a.earTagNumber}`);
              }}
            />
          </View>
        </FormField>

        <FormField label="Farm" error={errors.farmId?.message} nativeID="farm">
          <View className="gap-2">
            {watch("farmId") ? (
              <View className="bg-secondary p-3 rounded-md">
                <Text className="text-foreground font-medium">{farmLabel}</Text>
              </View>
            ) : null}
            <FarmPicker
              onSelect={(f) => {
                setValue("farmId", f.id, { shouldValidate: true });
                setFarmLabel(f.name ?? "");
              }}
            />
          </View>
        </FormField>

        <FormField label="Death Date (YYYY-MM-DD)" error={errors.deathDate?.message} nativeID="deathDate">
          <Input
            placeholder="2026-01-15"
            value={watch("deathDate")}
            onChangeText={(t) => setValue("deathDate", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Cause of Death" error={errors.deathCause?.message} nativeID="deathCause">
          <Input
            placeholder="e.g. disease, accident, old age"
            value={watch("deathCause")}
            onChangeText={(t) => setValue("deathCause", t, { shouldValidate: true })}
          />
        </FormField>

        {!canRecordDeath ? (
          <Text className="text-sm text-muted-foreground">
            You don't have permission to record animal deaths.
          </Text>
        ) : !onlineManager.isOnline() ? (
          <Text className="text-sm text-muted-foreground">
            Offline — the death is saved locally and syncs when you reconnect.
          </Text>
        ) : null}

        <Button onPress={onSubmit} disabled={isSubmitting || !canRecordDeath} size="lg">
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Record Death</Text>}
        </Button>
      </CardContent>
      </Card>
    </ScrollView>
  );
}
