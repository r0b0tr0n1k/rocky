// biome-ignore assist/source/organizeImports: biome
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";
import { ANIMAL_STATUS } from "@rocky/validators/enums";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

export default function AnimalSearchScreen() {
  const router = useRouter();
  const [earTag, setEarTag] = useState("");
  const [stateCode, setStateCode] = useState<"MK">("MK");
  const [searchTag, setSearchTag] = useState("");

  const {
    data: animal,
    isLoading,
    error,
  } = trpc.animal.findByTag.useQuery({ earTag: searchTag, stateCode }, { enabled: searchTag.length > 0 });

  const handleSearch = () => {
    if (!earTag || earTag.length < 8) {
      Alert.alert("Error", "Please enter a valid 8-character ear tag number");
      return;
    }
    setSearchTag(earTag);
  };

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <View className="gap-2">
        <Text className="text-foreground text-sm font-medium">Ear Tag Number</Text>
        <Input
          placeholder="e.g. MK123456"
          value={earTag}
          onChangeText={setEarTag}
          maxLength={8}
          autoCapitalize="characters"
        />
        <Button onPress={handleSearch} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text>Search</Text>}
        </Button>
      </View>

      {animal && (
        <Card>
          <CardContent className="gap-3 pt-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground text-lg font-bold">
                {animal.stateCode} {animal.earTagNumber}
              </Text>
              <Badge variant={animal.status === ANIMAL_STATUS.ALIVE ? "default" : "secondary"}>
                <Text className="text-xs">{animal.status}</Text>
              </Badge>
            </View>
            <Text className="text-muted-foreground">Sex: {animal.sex}</Text>
            <Text className="text-muted-foreground">Breed: {animal.breed ?? "N/A"}</Text>
            <Text className="text-muted-foreground">Birth: {new Date(animal.birthDate).toLocaleDateString()}</Text>
            <Button onPress={() => router.push(`/animals/${animal.id}`)}>
              <Text>View Details</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <Text className="text-destructive text-center">Animal not found</Text>}
    </View>
  );
}
