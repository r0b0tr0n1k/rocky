import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useSession } from "@/providers/session-provider";

export default function IndexScreen() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/signin" />;
}
