import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { trpc } from "@/providers/trpc-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { TEST_TYPE, TEST_RESULT } from "@rocky/validators/enums";
import type { testTypeType, testResultType } from "@rocky/validators/enums";
import { enumToOptions, titleCase } from "@/lib/enum-options";

export default function LabTestScreen() {
  const router = useRouter();
  const [animalId, setAnimalId] = useState("");
  const [animalLabel, setAnimalLabel] = useState("");
  const [farmId, setFarmId] = useState("");
  const [farmLabel, setFarmLabel] = useState("");
  const [diseaseId] = useState("");
  const [testType, setTestType] = useState<testTypeType | "">("");
  const [result, setResult] = useState<testResultType | "">("");
  const [sampleDate, setSampleDate] = useState("");
  const [resultDate, setResultDate] = useState("");

  const TEST_TYPE_OPTIONS = enumToOptions(TEST_TYPE);
  const RESULT_OPTIONS = enumToOptions(TEST_RESULT);

  const recordLabTest = trpc.health.recordLabTest.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const canWriteHealth = useCan("health:write");

  const handleSubmit = () => {
    if (!animalId || !farmId || !testType || !result || !sampleDate || !resultDate) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    recordLabTest.mutate({
      animalId, farmId,
      diseaseId: diseaseId || "00000000-0000-0000-0000-000000000000",
      testType: testType || TEST_TYPE.SEROLOGY,
      result: result || TEST_RESULT.POSITIVE,
      sampleDate: sampleDate,
      resultDate: resultDate,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="gap-2">
          <Label>Animal</Label>
          {animalId ? <View className="bg-secondary p-3 rounded-md"><Text className="text-foreground font-medium">{animalLabel}</Text></View> : null}
          <AnimalPicker onSelect={(a) => { setAnimalId(a.id); setAnimalLabel(`${a.stateCode} ${a.earTagNumber}`); }} />
        </View>
        <View className="gap-2">
          <Label>Farm</Label>
          {farmId ? <View className="bg-secondary p-3 rounded-md"><Text className="text-foreground font-medium">{farmLabel}</Text></View> : null}
          <FarmPicker onSelect={(f) => { setFarmId(f.id); setFarmLabel(f.name ?? ""); }} />
        </View>
        <View className="gap-2">
          <Label nativeID="testType">Test Type</Label>
           <Select
            value={testType ? { value: testType, label: titleCase(testType) } : undefined}
            onValueChange={(opt) => setTestType((opt?.value ?? "") as testTypeType | "")}
          >
            <SelectTrigger><SelectValue placeholder="Select test type..." /></SelectTrigger>
            <SelectContent>
              {TEST_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt.value} label={opt.label} value={opt.value} />))}
            </SelectContent>
          </Select>
        </View>
        <View className="gap-2">
          <Label nativeID="result">Result</Label>
           <Select
            value={result ? { value: result, label: titleCase(result) } : undefined}
            onValueChange={(opt) => setResult((opt?.value ?? "") as testResultType | "")}
          >
            <SelectTrigger><SelectValue placeholder="Select result..." /></SelectTrigger>
            <SelectContent>
              {RESULT_OPTIONS.map((opt) => (<SelectItem key={opt.value} label={opt.label} value={opt.value} />))}
            </SelectContent>
          </Select>
        </View>
        <View className="gap-2">
          <Label nativeID="sampleDate">Sample Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={sampleDate} onChangeText={setSampleDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="resultDate">Result Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-20" value={resultDate} onChangeText={setResultDate} />
        </View>
        {!canWriteHealth ? (
          <Text className="text-sm text-muted-foreground">You don't have permission to record health events.</Text>
        ) : null}
        <Button onPress={handleSubmit} disabled={recordLabTest.isPending || !canWriteHealth} size="lg">
          <Text>Record Lab Test</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
