import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "destructive",
  under_review: "secondary",
  resolved: "default",
  escalated: "destructive",
  rejected: "secondary",
};

export default function CorrectionsListScreen() {
  const router = useRouter();
  const { data } = trpc.correction.list.useQuery({ limit: 50, offset: 0 });

  return (
    <View className="flex-1 bg-background p-4">
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/corrections/${item.id}`)}
            className="flex-row items-center justify-between py-3 border-b border-border"
          >
            <View className="flex-1">
              <Text className="text-foreground font-medium">{item.errorType}</Text>
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {item.errorDescription}
              </Text>
            </View>
            <Badge variant={STATUS_COLORS[item.status] ?? "secondary"}>
              <Text className="text-xs">{item.status.replace("_", " ")}</Text>
            </Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No corrections found</Text>}
      />
    </View>
  );
}
