import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { trpc } from "@/providers/trpc-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";

export default function DeathScreen() {
  const router = useRouter();
  const [animalId, setAnimalId] = useState("");
  const [animalLabel, setAnimalLabel] = useState("");
  const [farmId, setFarmId] = useState("");
  const [farmLabel, setFarmLabel] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [deathCause, setDeathCause] = useState("");

  const recordDeath = trpc.movement.recordDeath.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const canRecordDeath = useCan("animal:death");

  const handleSubmit = () => {
    if (!animalId || !farmId || !deathDate || !deathCause) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    recordDeath.mutate({ animalId, farmId, deathDate, deathCause });
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
          <Label nativeID="deathDate">Death Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={deathDate} onChangeText={setDeathDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="deathCause">Cause of Death</Label>
          <Input placeholder="e.g. disease, accident, old age" value={deathCause} onChangeText={setDeathCause} />
        </View>
        {!canRecordDeath ? (
          <Text className="text-sm text-muted-foreground">You don't have permission to record animal deaths.</Text>
        ) : null}
        <Button onPress={handleSubmit} disabled={recordDeath.isPending || !canRecordDeath} size="lg">
          <Text>Record Death</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
