import { useState } from "react";
import { View, ScrollView, Alert, Switch } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

export default function TreatmentScreen() {
  const router = useRouter();
  const [animalId, setAnimalId] = useState("");
  const [animalLabel, setAnimalLabel] = useState("");
  const [farmId, setFarmId] = useState("");
  const [farmLabel, setFarmLabel] = useState("");
  const [diseaseId, setDiseaseId] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [treatmentDesc, setTreatmentDesc] = useState("");
  const [isolated, setIsolated] = useState(false);

  const recordTreatment = trpc.health.recordTreatment.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const handleSubmit = async () => {
    if (!animalId || !farmId || !diagnosisDate) {
      Alert.alert("Error", "Please fill in animal, farm, and diagnosis date");
      return;
    }
    try {
      await recordTreatment.mutateAsync({
        animalId, farmId,
        diseaseId: diseaseId || null,
        vetId: "00000000-0000-0000-0000-000000000000",
        diagnosisDate,
        treatmentDesc: treatmentDesc || undefined,
        isolated,
      });
    } catch {}
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
          <Label nativeID="diseaseId">Disease ID (optional)</Label>
          <Input placeholder="UUID of the disease" value={diseaseId} onChangeText={setDiseaseId} />
        </View>
        <View className="gap-2">
          <Label nativeID="diagnosisDate">Diagnosis Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={diagnosisDate} onChangeText={setDiagnosisDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="treatmentDesc">Treatment Description (optional)</Label>
          <Input placeholder="Describe the treatment" value={treatmentDesc} onChangeText={setTreatmentDesc} />
        </View>
        <View className="flex-row items-center justify-between">
          <Label>Isolated</Label>
          <Switch value={isolated} onValueChange={setIsolated} />
        </View>
        <Button onPress={handleSubmit} disabled={recordTreatment.isPending} size="lg">
          <Text>Record Treatment</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
