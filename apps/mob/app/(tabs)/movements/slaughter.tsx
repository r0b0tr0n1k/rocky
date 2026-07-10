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

export default function SlaughterScreen() {
  const router = useRouter();
  const [animalId, setAnimalId] = useState("");
  const [animalLabel, setAnimalLabel] = useState("");
  const [fromFarmId, setFromFarmId] = useState("");
  const [fromFarmLabel, setFromFarmLabel] = useState("");
  const [slaughterhouseId, setSlaughterhouseId] = useState("");
  const [slaughterDate, setSlaughterDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");

  const recordSlaughter = trpc.movement.recordSlaughter.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const canRecordSlaughter = useCan("slaughter:register");

  const handleSubmit = () => {
    if (!animalId || !fromFarmId || !slaughterhouseId || !slaughterDate) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    recordSlaughter.mutate({
      animalId, fromFarmId, slaughterhouseId,
      slaughterDate,
      arrivalDate: arrivalDate || undefined,
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
          <Label>Source Farm</Label>
          {fromFarmId ? <View className="bg-secondary p-3 rounded-md"><Text className="text-foreground font-medium">{fromFarmLabel}</Text></View> : null}
          <FarmPicker onSelect={(f) => { setFromFarmId(f.id); setFromFarmLabel(f.name ?? ""); }} />
        </View>
        <View className="gap-2">
          <Label nativeID="slaughterhouseId">Slaughterhouse ID</Label>
          <Input placeholder="UUID of the slaughterhouse" value={slaughterhouseId} onChangeText={setSlaughterhouseId} />
        </View>
        <View className="gap-2">
          <Label nativeID="slaughterDate">Slaughter Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={slaughterDate} onChangeText={setSlaughterDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="arrivalDate">Arrival Date (optional, YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-14" value={arrivalDate} onChangeText={setArrivalDate} />
        </View>
        {!canRecordSlaughter ? (
          <Text className="text-sm text-muted-foreground">You don't have permission to record slaughters.</Text>
        ) : null}
        <Button onPress={handleSubmit} disabled={recordSlaughter.isPending || !canRecordSlaughter} size="lg">
          <Text>Record Slaughter</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
