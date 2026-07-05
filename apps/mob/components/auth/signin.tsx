import { useState } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth";
import { useSession } from "@/providers/session-provider";

interface SignInProps {
  onSuccess?: () => void;
}

export const SignIn = ({ onSuccess }: SignInProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { onAuthSuccess } = useSession();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        Alert.alert("Error", result.error.message || "Sign in failed");
      } else if (result.data) {
        await onAuthSuccess();
        onSuccess?.();
      }
    } catch {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="gap-6 p-5">
      <View className="gap-2">
        <Text className="text-foreground text-2xl font-bold">Sign In</Text>
        <Text className="text-muted-foreground text-sm">
          Enter your email and password to sign in
        </Text>
      </View>

      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-foreground text-sm font-medium">Email</Text>
          <Input
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
            className="web:flex-1"
          />
        </View>

        <View className="gap-2">
          <Text className="text-foreground text-sm font-medium">Password</Text>
          <Input
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            className="web:flex-1"
          />
        </View>

        <Button
          onPress={handleSubmit}
          disabled={isLoading || !email || !password}
          size="lg"
          className="mt-2"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text>Sign In</Text>
          )}
        </Button>
      </View>
    </View>
  );
};
