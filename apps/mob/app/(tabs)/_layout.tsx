import { Tabs, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useSession } from "@/providers/session-provider";
import { usePermissions } from "@/providers/permissions-provider";
import { Icon } from "@/components/ui/icon";
import { Home, PawPrint, Heart, Truck, ClipboardList, Tag, BookOpen, Bell, Wifi, FileWarning, User } from "lucide-react-native";

export default function TabLayout() {
  const { data: session, isPending } = useSession();
  const { permissions, isLoading } = usePermissions();
  // Mirror web filterNavByPermissions: a tab is shown when it has no required
  // permission, or the principal holds it. Fail-closed while loading.
  const can = (permission?: string) => !permission || permissions.includes(permission);

  if (isPending || isLoading) {
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
      {can("animal:read") && (
        <Tabs.Screen name="animals" options={{ title: "Animals", tabBarIcon: ({ color }) => <Icon as={PawPrint} color={color} /> }} />
      )}
      {can("health:read") && (
        <Tabs.Screen name="health" options={{ title: "Health", tabBarIcon: ({ color }) => <Icon as={Heart} color={color} /> }} />
      )}
      {can("movement:read") && (
        <Tabs.Screen name="movements" options={{ title: "Movements", tabBarIcon: ({ color }) => <Icon as={Truck} color={color} /> }} />
      )}
      {can("analysis:read") && (
        <Tabs.Screen name="inspections" options={{ title: "Inspections", tabBarIcon: ({ color }) => <Icon as={ClipboardList} color={color} /> }} />
      )}
      {can("eartag:read") && (
        <Tabs.Screen name="eartags" options={{ title: "Ear Tags", tabBarIcon: ({ color }) => <Icon as={Tag} color={color} /> }} />
      )}
      {can("passport:read") && (
        <Tabs.Screen name="passport" options={{ title: "Passport", tabBarIcon: ({ color }) => <Icon as={BookOpen} color={color} /> }} />
      )}
      {can("correction:read") && (
        <Tabs.Screen name="corrections" options={{ title: "Corrections", tabBarIcon: ({ color }) => <Icon as={FileWarning} color={color} /> }} />
      )}
      {can("notification:read") && (
        <Tabs.Screen name="notifications" options={{ title: "Alerts", tabBarIcon: ({ color }) => <Icon as={Bell} color={color} /> }} />
      )}
      <Tabs.Screen name="sync" options={{ title: "Sync", tabBarIcon: ({ color }) => <Icon as={Wifi} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Profile", tabBarIcon: ({ color }) => <Icon as={User} color={color} /> }} />
    </Tabs>
  );
}
