// biome-ignore assist/source/organizeImports: biome
import { SignIn } from "@/components/auth/signin";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, TouchableOpacity, View } from "react-native";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <View className="flex-1 justify-center p-4">
        <SignIn />
        <View className="flex-row justify-center items-center mt-6 gap-2">
          <Text className="text-muted-foreground text-sm">Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="text-primary text-sm font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
