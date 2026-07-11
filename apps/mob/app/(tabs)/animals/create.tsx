import { Button } from "@/components/ui/button";
import { EnumSelect } from "@/components/ui/enum-select";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { FarmPicker } from "@/components/farms/farm-picker";
import { useActiveFarm } from "@/providers/active-farm-provider";
import { onlineManager } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc-provider";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useOffline } from "@/providers/offline-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { BIRTH_TYPE, SEX } from "@rocky/validators/enums";
import type { birthTypeType, sexType } from "@rocky/validators/enums";
import { createAnimalRequestSchema } from "@rocky/validators/api";
import { z } from "zod";

// Zod 4: `createAnimalRequestSchema` is a ZodObject that has absorbed its
// `.refine()` as a "check", and `.omit()` rejects objects containing checks.
// Rebuild from `.shape` (reusing the exact field schemas — single source of
// truth) so the top object has no checks, then omit the context/numeric fields
// and adapt `birthWeight` to a string input. The canonical "birth date not in
// the future" rule is re-applied below to keep client/server parity.
const createAnimalFormSchema = z
  .object(createAnimalRequestSchema.shape)
  .omit({ currentFarmId: true, stateCode: true, status: true, birthWeight: true })
  .extend({
    birthWeight: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+$/.test(v), "Birth weight must be a whole number"),
  })
  .refine(
    (data) => {
      if (data.birthDate) {
        const d = new Date(data.birthDate);
        if (d instanceof Date && d > new Date()) return false;
      }
      return true;
    },
    { message: "Birth date cannot be in the future" },
  );

// UX-friendly form shape: enum fields allow `undefined` until selected.
type CreateAnimalForm = {
  earTagNumber: string;
  sex: sexType | undefined;
  breed: string;
  birthDate: string;
  birthType: birthTypeType | undefined;
  birthWeight: string;
};

export default function CreateAnimalScreen() {
  const router = useRouter();
  const { activeFarm, setActiveFarm } = useActiveFarm();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueAnimal = useOfflineMutation("animal");
  const canRegister = useCan("animal:register");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnimalForm>({
    // Resolver validates against the canonical schema; the form type is a
    // UX variant that permits `undefined` for not-yet-selected enums.
    resolver: zodResolver(createAnimalFormSchema) as Resolver<CreateAnimalForm>,
    mode: "onTouched",
    defaultValues: {
      earTagNumber: "",
      sex: undefined,
      breed: "",
      birthDate: "",
      birthType: undefined,
      birthWeight: "",
    },
  });

  const createAnimal = trpc.animal.create.useMutation({
    onSuccess: () => {
      utils.animal.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const onSubmit = handleSubmit((values) => {
    // Guarded by the disabled state below, but kept defensive: a farm must be
    // selected (context) before an animal can be registered to it.
    if (!activeFarm.id) return;
    const payload = {
      earTagNumber: values.earTagNumber.toUpperCase(),
      // Validation already guarantees `sex` is set by the time we reach here.
      sex: values.sex as sexType,
      breed: values.breed || undefined,
      birthDate: values.birthDate,
      birthType: values.birthType,
      birthWeight: values.birthWeight ? Number(values.birthWeight) : undefined,
      currentFarmId: activeFarm.id,
      stateCode: activeFarm.stateCode,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The outbox drains on
      // reconnect via OfflineProvider; the Server re-validates @Policy + RLS.
      if (deviceId) void enqueueAnimal(payload);
      utils.animal.list.invalidate();
      router.back();
      return;
    }
    createAnimal.mutate(payload);
  });

  const sex = watch("sex");
  const birthType = watch("birthType");

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <FormField label="Farm" error={!activeFarm.id ? "Select a farm first" : undefined}>
          <FarmPicker
            onSelect={(farm) => setActiveFarm({ id: farm.id, stateCode: activeFarm.stateCode })}
          />
        </FormField>

        <FormField label="Ear Tag Number" error={errors.earTagNumber?.message} nativeID="earTag">
          <Input
            placeholder="MK123456"
            value={watch("earTagNumber")}
            onChangeText={(t) => setValue("earTagNumber", t, { shouldValidate: true })}
            maxLength={8}
            autoCapitalize="characters"
            accessibilityLabelledBy="earTag"
          />
        </FormField>

        <FormField label="Sex" error={errors.sex?.message} nativeID="sex">
          <EnumSelect
            dict={SEX}
            value={sex}
            onValueChange={(v) => setValue("sex", v, { shouldValidate: true })}
            placeholder="Select sex..."
          />
        </FormField>

        <FormField label="Breed (optional)" error={errors.breed?.message} nativeID="breed">
          <Input
            placeholder="e.g. Holstein"
            value={watch("breed")}
            onChangeText={(t) => setValue("breed", t, { shouldValidate: true })}
            accessibilityLabelledBy="breed"
          />
        </FormField>

        <FormField
          label="Birth Date (YYYY-MM-DD)"
          error={errors.birthDate?.message}
          nativeID="birthDate"
        >
          <Input
            placeholder="2026-01-15"
            value={watch("birthDate")}
            onChangeText={(t) => setValue("birthDate", t, { shouldValidate: true })}
            accessibilityLabelledBy="birthDate"
          />
        </FormField>

        <FormField label="Birth Type (optional)" error={errors.birthType?.message} nativeID="birthType">
          <EnumSelect
            dict={BIRTH_TYPE}
            value={birthType}
            onValueChange={(v) => setValue("birthType", v, { shouldValidate: true })}
            placeholder="Select type..."
          />
        </FormField>

        <FormField
          label="Birth Weight (kg, optional)"
          error={errors.birthWeight?.message}
          nativeID="birthWeight"
        >
          <Input
            placeholder="e.g. 45"
            value={watch("birthWeight")}
            onChangeText={(t) => setValue("birthWeight", t, { shouldValidate: true })}
            keyboardType="numeric"
            accessibilityLabelledBy="birthWeight"
          />
        </FormField>

        {!activeFarm.id ? (
          <Text className="text-sm text-muted-foreground">Select a farm to enable registration.</Text>
        ) : !canRegister ? (
          <Text className="text-sm text-muted-foreground">You don't have permission to register animals.</Text>
        ) : !onlineManager.isOnline() ? (
          <Text className="text-sm text-muted-foreground">
            Offline — the animal is saved locally and syncs when you reconnect.
          </Text>
        ) : null}

        <Button
          onPress={onSubmit}
          disabled={isSubmitting || !activeFarm.id || !canRegister}
          size="lg"
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Register Animal</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
