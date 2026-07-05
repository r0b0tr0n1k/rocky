import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

export default function InspectionsListScreen() {
  const router = useRouter();
  const { data } = trpc.inspection.list.useQuery({ limit: 50, offset: 0 });

  return (
    <View className="flex-1 bg-background p-4">
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/inspections/${item.id}`)}
            className="flex-row items-center justify-between py-3 border-b border-border"
          >
            <View>
              <Text className="text-foreground font-medium">Farm: {item.farmId.slice(0, 8)}</Text>
              <Text className="text-muted-foreground text-sm">
                {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : "No date"}
              </Text>
            </View>
            <Badge variant={item.status === "completed" ? "default" : "secondary"}>
              <Text className="text-xs">{item.status}</Text>
            </Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No inspections found</Text>}
      />
    </View>
  );
}
