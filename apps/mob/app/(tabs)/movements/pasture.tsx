import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { onlineManager } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc-provider";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useOffline } from "@/providers/offline-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { notifyError, notifySuccess } from "@/lib/notify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { declarePastureRequestSchema } from "@rocky/validators/api";
import { z } from "zod";

// Rebuilt from `declarePastureRequestSchema.shape` (single source of truth).
// `animalIds` is a comma-separated string in the UI; it is split into the
// uuid array the API expects at submit time.
const declarePastureFormSchema = z
  .object(declarePastureRequestSchema.shape)
  .omit({ animalIds: true })
  .extend({
    animalIds: z.string().min(1, "Enter at least one animal ID"),
  });

type DeclarePastureForm = {
  animalIds: string;
  fromFarmId: string;
  toFarmId: string;
  departureDate: string;
  expectedReturnDate: string;
  pastureType: string;
};

export default function PastureScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueuePasture = useOfflineMutation("movement");
  const canDeclarePasture = useCan("movement:pasture");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DeclarePastureForm>({
    resolver: zodResolver(declarePastureFormSchema) as Resolver<DeclarePastureForm>,
    mode: "onTouched",
    defaultValues: {
      animalIds: "",
      fromFarmId: "",
      toFarmId: "",
      departureDate: "",
      expectedReturnDate: "",
      pastureType: "",
    },
  });

  const declarePasture = trpc.movement.declarePasture.useMutation({
    onSuccess: () => {
      notifySuccess("Pasture movement declared");
      utils.movement.list.invalidate();
      router.back();
    },
    onError: (error) => {
      notifyError(error);
    },
  });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      animalIds: values.animalIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fromFarmId: values.fromFarmId,
      toFarmId: values.toFarmId,
      departureDate: values.departureDate,
      expectedReturnDate: values.expectedReturnDate,
      pastureType: values.pastureType,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The Server re-validates
      // @Policy + RLS on sync.
      if (deviceId) void enqueuePasture(payload);
      notifySuccess("Pasture movement saved locally — will sync when online");
      utils.movement.list.invalidate();
      router.back();
      return;
    }
    declarePasture.mutate(payload);
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <FormField
          label="Animal IDs (comma-separated)"
          error={errors.animalIds?.message}
          nativeID="animalIds"
        >
          <Input
            placeholder="uuid1, uuid2, uuid3"
            value={watch("animalIds")}
            onChangeText={(t) => setValue("animalIds", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="From Farm ID" error={errors.fromFarmId?.message} nativeID="fromFarmId">
          <Input
            placeholder="UUID of source farm"
            value={watch("fromFarmId")}
            onChangeText={(t) => setValue("fromFarmId", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="To Farm (Pasture) ID" error={errors.toFarmId?.message} nativeID="toFarmId">
          <Input
            placeholder="UUID of destination pasture"
            value={watch("toFarmId")}
            onChangeText={(t) => setValue("toFarmId", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Departure Date (YYYY-MM-DD)"
          error={errors.departureDate?.message}
          nativeID="departureDate"
        >
          <Input
            placeholder="2026-06-01"
            value={watch("departureDate")}
            onChangeText={(t) => setValue("departureDate", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Expected Return Date (YYYY-MM-DD)"
          error={errors.expectedReturnDate?.message}
          nativeID="expectedReturnDate"
        >
          <Input
            placeholder="2026-10-01"
            value={watch("expectedReturnDate")}
            onChangeText={(t) => setValue("expectedReturnDate", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Pasture Type" error={errors.pastureType?.message} nativeID="pastureType">
          <Input
            placeholder="e.g. summer, winter, alpine"
            value={watch("pastureType")}
            onChangeText={(t) => setValue("pastureType", t, { shouldValidate: true })}
          />
        </FormField>

        {!canDeclarePasture ? (
          <Text className="text-sm text-muted-foreground">
            You don't have permission to declare pasture movements.
          </Text>
        ) : !onlineManager.isOnline() ? (
          <Text className="text-sm text-muted-foreground">
            Offline — the pasture movement is saved locally and syncs when you reconnect.
          </Text>
        ) : null}

        <Button onPress={onSubmit} disabled={isSubmitting || !canDeclarePasture} size="lg">
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Declare Pasture Movement</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
