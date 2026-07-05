import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

export default function PastureScreen() {
  const router = useRouter();
  const [animalIds, setAnimalIds] = useState("");
  const [fromFarmId, setFromFarmId] = useState("");
  const [toFarmId, setToFarmId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [pastureType, setPastureType] = useState("");

  const declarePasture = trpc.movement.declarePasture.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const handleSubmit = async () => {
    if (!animalIds || !fromFarmId || !toFarmId || !departureDate || !expectedReturnDate || !pastureType) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const ids = animalIds.split(",").map(s => s.trim());
    try {
      await declarePasture.mutateAsync({
        animalIds: ids,
        fromFarmId, toFarmId, departureDate,
        expectedReturnDate, pastureType,
      });
    } catch {}
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="gap-2">
          <Label nativeID="animalIds">Animal IDs (comma-separated)</Label>
          <Input placeholder="uuid1, uuid2, uuid3" value={animalIds} onChangeText={setAnimalIds} />
        </View>
        <View className="gap-2">
          <Label nativeID="fromFarmId">From Farm ID</Label>
          <Input placeholder="UUID of source farm" value={fromFarmId} onChangeText={setFromFarmId} />
        </View>
        <View className="gap-2">
          <Label nativeID="toFarmId">To Farm (Pasture) ID</Label>
          <Input placeholder="UUID of destination pasture" value={toFarmId} onChangeText={setToFarmId} />
        </View>
        <View className="gap-2">
          <Label nativeID="departureDate">Departure Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-06-01" value={departureDate} onChangeText={setDepartureDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="expectedReturnDate">Expected Return Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-10-01" value={expectedReturnDate} onChangeText={setExpectedReturnDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="pastureType">Pasture Type</Label>
          <Input placeholder="e.g. summer, winter, alpine" value={pastureType} onChangeText={setPastureType} />
        </View>
        <Button onPress={handleSubmit} disabled={declarePasture.isPending} size="lg">
          <Text>Declare Pasture Movement</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
