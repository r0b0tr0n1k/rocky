import { View, FlatList, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";

// Lists recorded treatments. Wired to `trpc.health.listTreatments`.
export default function TreatmentListScreen() {
  const { data } = trpc.health.listTreatments.useQuery({ limit: 20, offset: 0 });

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
        <Text className="mt-2 text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-foreground text-xl font-bold">Treatments</Text>
      <FlatList
        data={data.data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between p-3 mb-2 bg-card border border-border rounded-lg">
            <View>
              <Text className="text-foreground font-medium">{item.treatmentDesc ?? "No description"}</Text>
              <Text className="text-muted-foreground text-sm">
                {item.diagnosisDate instanceof Date
                  ? item.diagnosisDate.toISOString().split("T")[0]
                  : String(item.diagnosisDate)}
              </Text>
            </View>
            {item.isolated ? <Text className="text-destructive text-xs font-medium">Isolated</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No treatments found</Text>}
      />
    </View>
  );
}
