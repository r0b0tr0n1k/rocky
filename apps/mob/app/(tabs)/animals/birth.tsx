// biome-ignore assist/source/organizeImports: biome
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { BIRTH_TYPE, SEX } from "@rocky/validators/enums";
import type { birthTypeType } from "@rocky/validators/enums";
import { enumToOptions } from "@/lib/enum-options";

const BIRTH_TYPE_OPTIONS = enumToOptions(BIRTH_TYPE);

export default function BirthNotificationScreen() {
  const router = useRouter();
  const [earTagNumber, setEarTagNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthType, setBirthType] = useState<birthTypeType | "">("");
  const [birthWeight, setBirthWeight] = useState("");
  const [motherTag, setMotherTag] = useState("");
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

  const canRegister = useCan("animal:register");

  const handleSubmit = async () => {
    if (!earTagNumber || earTagNumber.length !== 8) {
      Alert.alert("Error", "Ear tag number must be 8 characters");
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
        sex: SEX.FEMALE,
        birthDate: birthDate,
        birthType: birthType || undefined,
        birthWeight: birthWeight ? parseInt(birthWeight, 10) : undefined,
        currentFarmId: "00000000-0000-0000-0000-000000000000",
        stateCode: "MK",
        isFirstTagging: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <Text className="text-foreground text-lg font-bold">Record New Birth</Text>

        <View className="gap-2">
          <Label nativeID="earTag">Calf Ear Tag Number</Label>
          <Input
            placeholder="MK123456"
            value={earTagNumber}
            onChangeText={setEarTagNumber}
            maxLength={8}
            autoCapitalize="characters"
          />
        </View>

        <View className="gap-2">
          <Label nativeID="birthDate">Birth Date (YYYY-MM-DD)</Label>
          <Input placeholder="2026-01-15" value={birthDate} onChangeText={setBirthDate} />
        </View>

        <View className="gap-2">
          <Label nativeID="motherTag">Mother Ear Tag (optional)</Label>
          <Input
            placeholder="MK654321"
            value={motherTag}
            onChangeText={setMotherTag}
            maxLength={8}
            autoCapitalize="characters"
          />
        </View>

        <View className="gap-2">
          <Label nativeID="birthType">Birth Type (optional)</Label>
          <Select
            value={
              birthType
                ? BIRTH_TYPE_OPTIONS.find((o) => o.value === birthType)
                : undefined
            }
            onValueChange={(opt) => setBirthType((opt?.value ?? "") as birthTypeType | "")}
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

        {!canRegister ? (
          <Text className="text-sm text-muted-foreground">You don't have permission to register animals.</Text>
        ) : null}
        <Button onPress={handleSubmit} disabled={isLoading || !canRegister} size="lg">
          {isLoading ? <ActivityIndicator color="white" /> : <Text>Submit Birth Notification</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
