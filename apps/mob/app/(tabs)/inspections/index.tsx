import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { trpc } from "@/providers/trpc-provider";
import { INSPECTION_STATUS } from "@rocky/validators/enums";
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
            className="flex-row items-center justify-between p-3 mb-2 bg-card border border-border rounded-lg"
          >
            <View>
              <Text className="text-foreground font-medium">Farm: {item.farmId.slice(0, 8)}</Text>
              <Text className="text-muted-foreground text-sm">
                {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : "No date"}
              </Text>
            </View>
            <Badge variant={item.status === INSPECTION_STATUS.COMPLETED ? "default" : "secondary"}>
              <Text className="text-xs">{item.status}</Text>
            </Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No inspections found</EmptyTitle>
              <EmptyDescription>Schedule or sync inspections to see them here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </View>
  );
}
