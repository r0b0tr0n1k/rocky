import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

export default function PassportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: passport, isLoading } = trpc.passport.getById.useQuery({ id });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </View>
    );
  }

  if (!passport) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-destructive">Passport not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-2xl font-bold">{passport.passportNumber}</Text>
          <Badge variant={passport.status === "active" ? "default" : "secondary"}>
            <Text className="text-xs">{passport.status}</Text>
          </Badge>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Row label="State Code" value={passport.stateCode} />
            <Row label="Animal ID" value={passport.animalId} />
            <Row label="Farm ID" value={passport.farmId} />
            <Row label="Issue Date" value={new Date(passport.issueDate).toLocaleDateString()} />
            <Row label="Shipped to VS" value={passport.shippedToVs ? "Yes" : "No"} />
            <Row label="Delivered" value={passport.deliveredToKeeper ? "Yes" : "No"} />
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="text-foreground font-medium">{value}</Text>
    </View>
  );
}
