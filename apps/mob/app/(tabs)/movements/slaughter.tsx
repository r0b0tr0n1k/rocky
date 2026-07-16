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
import { recordSlaughterRequestSchema } from "@rocky/validators/api";
import { z } from "zod";

// Rebuilt from `recordSlaughterRequestSchema.shape` (single source of truth).
// All fields are string inputs; picker-resolved ids are uuid strings.
const recordSlaughterFormSchema = z.object(recordSlaughterRequestSchema.shape);

type RecordSlaughterForm = z.infer<typeof recordSlaughterFormSchema>;

export default function SlaughterScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueSlaughter = useOfflineMutation("movement");
  const canRecordSlaughter = useCan("slaughter:register");

  const [animalLabel, setAnimalLabel] = useState("");
  const [fromFarmLabel, setFromFarmLabel] = useState("");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordSlaughterForm>({
    resolver: zodResolver(recordSlaughterFormSchema) as Resolver<RecordSlaughterForm>,
    mode: "onTouched",
    defaultValues: {
      animalId: "",
      fromFarmId: "",
      slaughterhouseId: "",
      slaughterDate: "",
      arrivalDate: "",
    },
  });

  const recordSlaughter = trpc.movement.recordSlaughter.useMutation({
    onSuccess: () => {
      notifySuccess("Slaughter recorded");
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
      fromFarmId: values.fromFarmId,
      slaughterhouseId: values.slaughterhouseId,
      slaughterDate: values.slaughterDate,
      arrivalDate: values.arrivalDate || undefined,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The Server re-validates
      // @Policy + RLS on sync.
      if (deviceId) void enqueueSlaughter(payload);
      notifySuccess("Slaughter saved locally — will sync when online");
      utils.movement.list.invalidate();
      router.back();
      return;
    }
    recordSlaughter.mutate(payload);
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

        <FormField label="Source Farm" error={errors.fromFarmId?.message} nativeID="fromFarm">
          <View className="gap-2">
            {watch("fromFarmId") ? (
              <View className="bg-secondary p-3 rounded-md">
                <Text className="text-foreground font-medium">{fromFarmLabel}</Text>
              </View>
            ) : null}
            <FarmPicker
              onSelect={(f) => {
                setValue("fromFarmId", f.id, { shouldValidate: true });
                setFromFarmLabel(f.name ?? "");
              }}
            />
          </View>
        </FormField>

        <FormField
          label="Slaughterhouse ID"
          error={errors.slaughterhouseId?.message}
          nativeID="slaughterhouseId"
        >
          {/* TODO: data-backed select blocked — no listX procedure in movement router
              (slaughterhouses are not farms; farm.list would mix in regular farms). */}
          <Input
            placeholder="UUID of the slaughterhouse"
            value={watch("slaughterhouseId")}
            onChangeText={(t) => setValue("slaughterhouseId", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Slaughter Date (YYYY-MM-DD)"
          error={errors.slaughterDate?.message}
          nativeID="slaughterDate"
        >
          <Input
            placeholder="2026-01-15"
            value={watch("slaughterDate")}
            onChangeText={(t) => setValue("slaughterDate", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Arrival Date (optional, YYYY-MM-DD)"
          error={errors.arrivalDate?.message}
          nativeID="arrivalDate"
        >
          <Input
            placeholder="2026-01-14"
            value={watch("arrivalDate")}
            onChangeText={(t) => setValue("arrivalDate", t, { shouldValidate: true })}
          />
        </FormField>

        {!canRecordSlaughter ? (
          <Text className="text-sm text-muted-foreground">
            You don't have permission to record slaughters.
          </Text>
        ) : !onlineManager.isOnline() ? (
          <Text className="text-sm text-muted-foreground">
            Offline — the slaughter is saved locally and syncs when you reconnect.
          </Text>
        ) : null}

        <Button onPress={onSubmit} disabled={isSubmitting || !canRecordSlaughter} size="lg">
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Record Slaughter</Text>}
        </Button>
      </CardContent>
      </Card>
    </ScrollView>
  );
}
