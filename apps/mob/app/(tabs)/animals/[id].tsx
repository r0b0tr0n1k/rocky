import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc-provider";
import { ANIMAL_STATUS } from "@rocky/validators/enums";
import { useLocalSearchParams } from "expo-router";

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animal, isLoading } = trpc.animal.getById.useQuery({ id });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full" />
      </View>
    );
  }

  if (!animal) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-destructive">Animal not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-foreground text-2xl font-bold">
              {animal.stateCode} {animal.earTagNumber}
            </Text>
            <Text className="text-muted-foreground">{animal.breed ?? "N/A"}</Text>
          </View>
          <Badge variant={animal.status === ANIMAL_STATUS.ALIVE ? "default" : "secondary"}>
            <Text className="text-xs">{animal.status}</Text>
          </Badge>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Sex</Text>
              <Text className="text-foreground font-medium">{animal.sex}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Birth Date</Text>
              <Text className="text-foreground font-medium">
                {new Date(animal.birthDate).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Birth Type</Text>
              <Text className="text-foreground font-medium">
                {animal.birthType ?? "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Birth Weight</Text>
              <Text className="text-foreground font-medium">
                {animal.birthWeight ? `${animal.birthWeight} kg` : "N/A"}
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
