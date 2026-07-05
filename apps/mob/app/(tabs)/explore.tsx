import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/signin");
  };

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4 p-4">
      <Text className="text-foreground text-lg font-bold">Profile</Text>
      <Button onPress={handleSignOut} variant="destructive">
        <Text>Sign Out</Text>
      </Button>
    </View>
  );
}
