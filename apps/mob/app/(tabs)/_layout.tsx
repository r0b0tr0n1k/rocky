import { Tabs, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useSession } from "@/providers/session-provider";
import { Icon } from "@/components/ui/icon";
import { Home, PawPrint, Heart, Truck, ClipboardList, Tag, BookOpen, Bell, Wifi, FileWarning, User } from "lucide-react-native";

export default function TabLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Icon as={Home} color={color} /> }} />
      <Tabs.Screen name="animals" options={{ title: "Animals", tabBarIcon: ({ color }) => <Icon as={PawPrint} color={color} /> }} />
      <Tabs.Screen name="health" options={{ title: "Health", tabBarIcon: ({ color }) => <Icon as={Heart} color={color} /> }} />
      <Tabs.Screen name="movements" options={{ title: "Movements", tabBarIcon: ({ color }) => <Icon as={Truck} color={color} /> }} />
      <Tabs.Screen name="inspections" options={{ title: "Inspections", tabBarIcon: ({ color }) => <Icon as={ClipboardList} color={color} /> }} />
      <Tabs.Screen name="eartags" options={{ title: "Ear Tags", tabBarIcon: ({ color }) => <Icon as={Tag} color={color} /> }} />
      <Tabs.Screen name="passport" options={{ title: "Passport", tabBarIcon: ({ color }) => <Icon as={BookOpen} color={color} /> }} />
      <Tabs.Screen name="corrections" options={{ title: "Corrections", tabBarIcon: ({ color }) => <Icon as={FileWarning} color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts", tabBarIcon: ({ color }) => <Icon as={Bell} color={color} /> }} />
      <Tabs.Screen name="sync" options={{ title: "Sync", tabBarIcon: ({ color }) => <Icon as={Wifi} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Profile", tabBarIcon: ({ color }) => <Icon as={User} color={color} /> }} />
    </Tabs>
  );
}
