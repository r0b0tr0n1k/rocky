import { View, FlatList, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";

// Lists recorded laboratory test results. Wired to `trpc.health.listLabTests`.
export default function LabTestListScreen() {
  const { data } = trpc.health.listLabTests.useQuery({ limit: 20, offset: 0 });

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
      <Text className="text-foreground text-xl font-bold">Lab Tests</Text>
      <FlatList
        data={data.data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between p-3 mb-2 bg-card border border-border rounded-lg">
            <View>
              <Text className="text-foreground font-medium">{item.testType}</Text>
              <Text className="text-muted-foreground text-sm">
                Sample:{" "}
                {item.sampleDate instanceof Date
                  ? item.sampleDate.toISOString().split("T")[0]
                  : String(item.sampleDate)}
              </Text>
            </View>
            <Text className="text-muted-foreground text-xs uppercase">{item.result}</Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No lab tests found</Text>}
      />
    </View>
  );
}
