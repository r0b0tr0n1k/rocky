import { View, KeyboardAvoidingView, Platform } from "react-native";
import { SignUp } from "@/components/auth/signup";
import { Text } from "@/components/ui/text";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center p-4">
        <SignUp onSuccess={() => router.replace("/(tabs)")} />
        <View className="flex-row justify-center items-center mt-6 gap-2">
          <Text className="text-muted-foreground text-sm">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signin")}>
            <Text className="text-primary text-sm font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
