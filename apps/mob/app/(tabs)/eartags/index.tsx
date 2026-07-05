import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function EarTagOrdersScreen() {
  const router = useRouter();
  const { data } = trpc.earTag.listOrders.useQuery({ limit: 50, offset: 0 });

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <View className="flex-row gap-2">
        <Button onPress={() => router.push("/eartags/create-order")} className="flex-1">
          <Icon as={Plus} className="size-4" />
          <Text>Create Order</Text>
        </Button>
        <Button onPress={() => router.push("/eartags/collect-tags")} variant="outline" className="flex-1">
          <Text>Collect Tags</Text>
        </Button>
      </View>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-border">
            <View>
              <Text className="text-foreground font-medium">Tag #{item.tagNumber}</Text>
              <Text className="text-muted-foreground text-sm">{item.stateCode}</Text>
            </View>
            <Badge><Text className="text-xs">{item.status}</Text></Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No orders found</Text>}
      />
    </View>
  );
}
