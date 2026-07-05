// biome-ignore assist/source/organizeImports: biomeS
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import { useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";

export default function AnimalsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.animal.list.useQuery({
    search: search || undefined,
    limit: 20,
    offset: 0,
  });

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <View className="flex-row gap-2">
        <Input placeholder="Search by ear tag or breed..." value={search} onChangeText={setSearch} className="flex-1" />
        <Button variant="outline" size="icon" onPress={() => router.push("/animals/search")}>
          <Icon as={Search} className="size-4" />
        </Button>
      </View>

      <Button onPress={() => router.push("/animals/create")}>
        <Icon as={Plus} className="size-4" />
        <Text>Register New Animal</Text>
      </Button>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/animals/${item.id}`)}
            className="flex-row items-center justify-between py-3 border-b border-border"
          >
            <View>
              <Text className="text-foreground font-medium">
                {item.stateCode} {item.earTagNumber}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {item.sex} — {item.breed ?? "N/A"}
              </Text>
            </View>
            <Badge variant={item.status === "alive" ? "default" : "secondary"}>
              <Text className="text-xs">{item.status}</Text>
            </Badge>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <Text className="text-muted-foreground text-center py-8">Loading...</Text>
          ) : (
            <Text className="text-muted-foreground text-center py-8">No animals found</Text>
          )
        }
      />
    </View>
  );
}
