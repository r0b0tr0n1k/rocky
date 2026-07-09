import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "expo-router";

type RouteHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

const MOVEMENT_ACTIONS: { title: string; route: RouteHref; desc: string }[] = [
  { title: "Record Death", route: "/movements/death", desc: "Record an animal death at farm, in transit, or at slaughter" },
  { title: "Pasture Declaration", route: "/movements/pasture", desc: "Declare pasture movement for one or more animals" },
  { title: "Record Slaughter", route: "/movements/slaughter", desc: "Record slaughter at a slaughterhouse" },
];

export default function MovementsIndexScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-foreground text-xl font-bold">Movements</Text>
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
