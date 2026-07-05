import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";
import { Search, Plus, Bird } from "lucide-react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { data: recentAnimals } = trpc.animal.list.useQuery({ limit: 5, offset: 0 });
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-2xl font-bold">Dashboard</Text>
          {unreadCount && unreadCount.count > 0 && (
            <Badge variant="destructive">
              <Text className="text-white text-xs">{unreadCount.count}</Text>
            </Badge>
          )}
        </View>

        <View className="flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push("/animals/search")}
          >
            <Icon as={Search} className="size-4" />
            <Text>Search</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push("/animals/create")}
          >
            <Icon as={Plus} className="size-4" />
            <Text>Register</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push("/animals/birth")}
          >
            <Icon as={Bird} className="size-4" />
            <Text>Birth</Text>
          </Button>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Recent Animals</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnimals?.data.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                onPress={() => router.push(`/animals/${animal.id}`)}
                className="flex-row items-center justify-between py-3 border-b border-border"
              >
                <View>
                  <Text className="text-foreground font-medium">
                    {animal.stateCode} {animal.earTagNumber}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {animal.sex} — {animal.breed ?? "N/A"}
                  </Text>
                </View>
                <Badge variant={animal.status === "alive" ? "default" : "secondary"}>
                  <Text className="text-xs">{animal.status}</Text>
                </Badge>
              </TouchableOpacity>
            ))}
            {(!recentAnimals || recentAnimals.data.length === 0) && (
              <Text className="text-muted-foreground text-center py-4">No animals found</Text>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
