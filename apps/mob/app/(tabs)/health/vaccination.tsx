import { useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimalPicker } from "@/components/animals/animal-picker";
import { FarmPicker } from "@/components/farms/farm-picker";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";
import { ADMIN_ROUTE } from "@rocky/validators/enums";
import type { administrationRouteType } from "@rocky/validators/enums";
import { enumToOptions, titleCase } from "@/lib/enum-options";

const ROUTE_OPTIONS = enumToOptions(ADMIN_ROUTE);

export default function VaccinationScreen() {
  const router = useRouter();
  const [animalId, setAnimalId] = useState("");
  const [animalLabel, setAnimalLabel] = useState("");
  const [farmId, setFarmId] = useState("");
  const [farmLabel, setFarmLabel] = useState("");
  const [vaccineId, setVaccineId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [route, setRoute] = useState<administrationRouteType | "">("");
  const [adminDate, setAdminDate] = useState("");
  const [notes, setNotes] = useState("");

  const recordVaccination = trpc.health.recordVaccination.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const handleSubmit = () => {
    if (!animalId || !farmId || !vaccineId || !batchId || !route || !adminDate) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    recordVaccination.mutate({
      animalId, farmId, vaccineId, batchId,
      vetId: "00000000-0000-0000-0000-000000000000",
      route: route || ADMIN_ROUTE.INTRAMUSCULAR,
      adminDate: adminDate,
      notes: notes || undefined,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="gap-2">
          <Label nativeID="animal">Animal</Label>
          {animalId ? (
            <View className="flex-row items-center justify-between bg-secondary p-3 rounded-md">
              <Text className="text-foreground font-medium">{animalLabel}</Text>
              <Badge variant="default"><Text className="text-xs">Selected</Text></Badge>
            </View>
          ) : null}
          <AnimalPicker onSelect={(a) => { setAnimalId(a.id); setAnimalLabel(`${a.stateCode} ${a.earTagNumber}`); }} />
        </View>
        <View className="gap-2">
          <Label nativeID="farm">Farm</Label>
          {farmId ? (
            <View className="bg-secondary p-3 rounded-md">
              <Text className="text-foreground font-medium">{farmLabel}</Text>
            </View>
          ) : null}
          <FarmPicker onSelect={(f) => { setFarmId(f.id); setFarmLabel(f.name ?? ""); }} />
        </View>
        <View className="gap-2">
          <Label nativeID="vaccineId">Vaccine ID</Label>
          <Input placeholder="UUID of the vaccine" value={vaccineId} onChangeText={setVaccineId} />
        </View>
        <View className="gap-2">
          <Label nativeID="batchId">Batch ID</Label>
          <Input placeholder="UUID of the batch" value={batchId} onChangeText={setBatchId} />
        </View>
        <View className="gap-2">
          <Label nativeID="route">Administration Route</Label>
           <Select
            value={route ? { value: route, label: titleCase(route) } : undefined}
            onValueChange={(opt) => setRoute((opt?.value ?? "") as administrationRouteType | "")}
          >
            <SelectTrigger><SelectValue placeholder="Select route..." /></SelectTrigger>
            <SelectContent>
              {ROUTE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </SelectContent>
          </Select>
        </View>
        <View className="gap-2">
          <Label nativeID="adminDate">Administration Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={adminDate} onChangeText={setAdminDate} />
        </View>
        <View className="gap-2">
          <Label nativeID="notes">Notes (optional)</Label>
          <Input placeholder="Any notes" value={notes} onChangeText={setNotes} />
        </View>
        <Button onPress={handleSubmit} disabled={recordVaccination.isPending} size="lg">
          {recordVaccination.isPending ? <ActivityIndicator color="white" /> : <Text>Record Vaccination</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
