import { View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "expo-router";
import { trpc } from "@/providers/trpc-provider";

type RouteHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

const MOVEMENT_ACTIONS: { title: string; route: RouteHref; desc: string }[] = [
  {
    title: "Record Death",
    route: "/movements/death",
    desc: "Record an animal death at farm, in transit, or at slaughter",
  },
  {
    title: "Pasture Declaration",
    route: "/movements/pasture",
    desc: "Declare pasture movement for one or more animals",
  },
  { title: "Record Slaughter", route: "/movements/slaughter", desc: "Record slaughter at a slaughterhouse" },
];

function formatMovementDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function MovementsIndexScreen() {
  const router = useRouter();
  const { data } = trpc.movement.list.useQuery({ limit: 20, offset: 0 });

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
      <Text className="text-foreground text-xl font-bold">Movements</Text>

      <FlatList
        data={data.data}
        keyExtractor={(item) => item.id}
        className="mb-2"
        renderItem={({ item }) => (
          <View className="p-3 mb-2 bg-card border border-border rounded-lg">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">{item.type}</Text>
              <Text className="text-muted-foreground text-xs">{formatMovementDate(item.movementDate)}</Text>
            </View>
            <Text className="text-muted-foreground text-sm">{item.animalId}</Text>
            <Text className="text-muted-foreground text-xs">
              {item.fromFarmId ?? "?"} → {item.toFarmId}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text className="text-muted-foreground text-center py-8">No movements found</Text>}
      />

      {MOVEMENT_ACTIONS.map((action) => (
        <TouchableOpacity key={action.title} onPress={() => router.push(action.route)}>
          <Card>
            <CardHeader>
              <CardTitle>{action.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-muted-foreground text-sm">{action.desc}</Text>
            </CardContent>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}
