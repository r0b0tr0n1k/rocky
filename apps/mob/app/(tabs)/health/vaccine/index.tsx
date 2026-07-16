import { View, FlatList, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";

// Lists the vaccine master catalogue (reference data). Wired to
// `trpc.health.listVaccines` — previously the health tab had no list at all.
export default function VaccineListScreen() {
  const { data } = trpc.health.listVaccines.useQuery({ limit: 20, offset: 0 });

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
      <Text className="text-foreground text-xl font-bold">Vaccines</Text>
      <FlatList
        data={data.data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between p-3 mb-2 bg-card border border-border rounded-lg">
            <View>
              <Text className="text-foreground font-medium">{item.name}</Text>
              <Text className="text-muted-foreground text-sm">{item.manufacturer ?? "Unknown manufacturer"}</Text>
            </View>
            <Text className="text-muted-foreground text-xs uppercase">{item.type}</Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No vaccines found</Text>}
      />
    </View>
  );
}
