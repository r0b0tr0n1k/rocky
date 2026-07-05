import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

const SEX_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const BIRTH_TYPE_OPTIONS = [
  { label: "Single", value: "single" },
  { label: "Twin", value: "twin" },
  { label: "Triplet", value: "triplet" },
  { label: "Stillborn", value: "stillborn" },
];

export default function CreateAnimalScreen() {
  const router = useRouter();
  const [earTagNumber, setEarTagNumber] = useState("");
  const [sex, setSex] = useState("");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthType, setBirthType] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const createAnimal = trpc.animal.create.useMutation({
    onSuccess: () => {
      utils.animal.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = async () => {
    if (earTagNumber?.length !== 8) {
      Alert.alert("Error", "Ear tag number must be 8 characters");
      return;
    }
    if (!sex) {
      Alert.alert("Error", "Please select sex");
      return;
    }
    if (!birthDate) {
      Alert.alert("Error", "Please enter birth date");
      return;
    }

    setIsLoading(true);
    try {
      await createAnimal.mutateAsync({
        earTagNumber: earTagNumber.toUpperCase(),
        sex: sex as "male" | "female",
        breed: breed || undefined,
        birthDate: birthDate,
        birthType: (birthType as "single" | "twin" | "triplet" | "stillborn") || undefined,
        birthWeight: birthWeight ? parseInt(birthWeight, 10) : undefined,
        currentFarmId: "00000000-0000-0000-0000-000000000000",
        stateCode: "MK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="gap-2">
          <Label nativeID="earTag">Ear Tag Number</Label>
          <Input
            placeholder="MK123456"
            value={earTagNumber}
            onChangeText={setEarTagNumber}
            maxLength={8}
            autoCapitalize="characters"
          />
        </View>

        <View className="gap-2">
          <Label nativeID="sex">Sex</Label>
          <Select
            value={sex ? { value: sex, label: SEX_OPTIONS.find((o) => o.value === sex)?.label ?? sex } : undefined}
            onValueChange={(opt) => setSex(opt?.value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex..." />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </SelectContent>
          </Select>
        </View>

        <View className="gap-2">
          <Label nativeID="breed">Breed (optional)</Label>
          <Input placeholder="e.g. Holstein" value={breed} onChangeText={setBreed} />
        </View>

        <View className="gap-2">
          <Label nativeID="birthDate">Birth Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={birthDate} onChangeText={setBirthDate} />
        </View>

        <View className="gap-2">
          <Label nativeID="birthType">Birth Type (optional)</Label>
          <Select
            value={
              birthType
                ? { value: birthType, label: BIRTH_TYPE_OPTIONS.find((o) => o.value === birthType)?.label ?? birthType }
                : undefined
            }
            onValueChange={(opt) => setBirthType(opt?.value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {BIRTH_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </SelectContent>
          </Select>
        </View>

        <View className="gap-2">
          <Label nativeID="birthWeight">Birth Weight (kg, optional)</Label>
          <Input placeholder="e.g. 45" value={birthWeight} onChangeText={setBirthWeight} keyboardType="numeric" />
        </View>

        <Button onPress={handleSubmit} disabled={isLoading} size="lg">
          {isLoading ? <ActivityIndicator color="white" /> : <Text>Register Animal</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
