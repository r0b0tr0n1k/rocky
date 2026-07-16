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
import { TEST_TYPE, TEST_RESULT } from "@rocky/validators/enums";
import type { testTypeType, testResultType } from "@rocky/validators/enums";
import { recordLabTestRequestSchema } from "@rocky/validators/api";
import { enumToOptions, titleCase } from "@/lib/enum-options";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const TEST_TYPE_OPTIONS = enumToOptions(TEST_TYPE);
const RESULT_OPTIONS = enumToOptions(TEST_RESULT);

// Rebuild the form schema from the canonical API schema's `.shape` (single
// source of truth). Server-only/optional fields the PDA form does not collect
// (`testMethod`, `labName`, `labSampleId`, `certificateRef`, `interpretation`,
// `resultNumeric`, `resultUnit`) are omitted. `diseaseId` is accepted as an
// empty string and resolved to a UUID at submit. Date fields are adapted to
// YYYY-MM-DD strings and the canonical future-date / ordering rules are
// re-applied for client/server parity. Zod 4: `.omit()` rejects objects that
// carry `.refine()` checks, so we rebuild from `.shape`.
//
// NOTE: `testType` / `result` are already enum-backed `Select`s (no `list*`
// procedure exists for lab-test types in the health router, so they stay as
// enum pickers). `diseaseId` is NOT a raw-UUID `Input` in this screen — it is
// resolved server-side to a fixed UUID at submit (see `onSubmit`). There is no
// data-backed select to convert here; the only raw `Input`s are the date fields.
const createLabTestFormSchema = z
  .object(recordLabTestRequestSchema.shape)
  .omit({
    testMethod: true,
    labName: true,
    labSampleId: true,
    certificateRef: true,
    interpretation: true,
    resultNumeric: true,
    resultUnit: true,
  })
  .extend({
    diseaseId: z.string(),
    sampleDate: z.string().min(1, "Sample date is required"),
    resultDate: z.string().min(1, "Result date is required"),
  })
  .refine(
    (data) => {
      if (data.sampleDate) {
        const d = new Date(data.sampleDate);
        if (d instanceof Date && d > new Date()) return false;
      }
      return true;
    },
    { message: "Sample date cannot be in the future" },
  )
  .refine(
    (data) => {
      if (data.sampleDate && data.resultDate) {
        return new Date(data.resultDate) >= new Date(data.sampleDate);
      }
      return true;
    },
    { message: "Result date must be on or after sample date" },
  );

type LabTestForm = {
  animalId: string;
  farmId: string;
  diseaseId: string;
  testType: testTypeType | undefined;
  result: testResultType | undefined;
  sampleDate: string;
  resultDate: string;
};

export default function LabTestScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueLabTest = useOfflineMutation("labTest");
  const canWriteHealth = useCan("health:write");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LabTestForm>({
    resolver: zodResolver(createLabTestFormSchema) as Resolver<LabTestForm>,
    mode: "onTouched",
    defaultValues: {
      animalId: "",
      farmId: "",
      diseaseId: "",
      testType: undefined,
      result: undefined,
      sampleDate: "",
      resultDate: "",
    },
  });

  const recordLabTest = trpc.health.recordLabTest.useMutation({
    onSuccess: () => {
      utils.health.listLabTests.invalidate();
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
      diseaseId: values.diseaseId || "00000000-0000-0000-0000-000000000000",
      testType: values.testType as testTypeType,
      result: values.result as testResultType,
      sampleDate: values.sampleDate,
      resultDate: values.resultDate,
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The outbox drains on
      // reconnect via OfflineProvider; the Server re-validates @Policy + RLS.
      if (deviceId) void enqueueLabTest(payload);
      utils.health.listLabTests.invalidate();
      router.back();
      return;
    }
    recordLabTest.mutate(payload);
  });

  const testType = watch("testType");
  const result = watch("result");

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

          <FormField label="Test Type" error={errors.testType?.message} nativeID="testType">
            <Select
              value={testType ? { value: testType, label: titleCase(testType) } : undefined}
              onValueChange={(opt) =>
                setValue("testType", (opt?.value ?? undefined) as testTypeType | undefined, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test type..." />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Result" error={errors.result?.message} nativeID="result">
            <Select
              value={result ? { value: result, label: titleCase(result) } : undefined}
              onValueChange={(opt) =>
                setValue("result", (opt?.value ?? undefined) as testResultType | undefined, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result..." />
              </SelectTrigger>
              <SelectContent>
                {RESULT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Sample Date (YYYY-MM-DD)" error={errors.sampleDate?.message} nativeID="sampleDate">
            <Input
              placeholder="2026-01-15"
              value={watch("sampleDate")}
              onChangeText={(t) => setValue("sampleDate", t, { shouldValidate: true })}
            />
          </FormField>

          <FormField label="Result Date (YYYY-MM-DD)" error={errors.resultDate?.message} nativeID="resultDate">
            <Input
              placeholder="2026-01-20"
              value={watch("resultDate")}
              onChangeText={(t) => setValue("resultDate", t, { shouldValidate: true })}
            />
          </FormField>

          {!canWriteHealth ? (
            <Text className="text-sm text-muted-foreground">You don't have permission to record health events.</Text>
          ) : !onlineManager.isOnline() ? (
            <Text className="text-sm text-muted-foreground">
              Offline — the lab test is saved locally and syncs when you reconnect.
            </Text>
          ) : null}

          <Button onPress={onSubmit} disabled={isSubmitting || !canWriteHealth} size="lg">
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Record Lab Test</Text>}
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
