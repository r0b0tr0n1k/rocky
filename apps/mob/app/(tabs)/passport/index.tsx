import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc-provider";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { PASSPORT_STATUS } from "@rocky/validators/enums";
import { useRouter } from "expo-router";

export default function PassportListScreen() {
  const router = useRouter();
  const { data } = trpc.passport.list.useQuery({ limit: 50, offset: 0 });

  return (
    <View className="flex-1 bg-background p-4">
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/passport/${item.id}`)}
            className="flex-row items-center justify-between py-3 border-b border-border"
          >
            <View>
              <Text className="text-foreground font-medium">{item.passportNumber}</Text>
              <Text className="text-muted-foreground text-sm">Animal: {item.animalId.slice(0, 8)}</Text>
            </View>
            <Badge variant={item.status === PASSPORT_STATUS.ACTIVE ? "default" : "secondary"}>
              <Text className="text-xs">{item.status}</Text>
            </Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No passports found</EmptyTitle>
              <EmptyDescription>Issued passports will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />
    </View>
  );
}
