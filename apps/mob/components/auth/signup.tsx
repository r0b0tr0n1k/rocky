import { useState } from "react";
import { View, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth";
import { useSession } from "@/providers/session-provider";

interface SignUpProps {
  onSuccess?: () => void;
}

export const SignUp = ({ onSuccess }: SignUpProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { onAuthSuccess } = useSession();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({ email, password, name });

      if (result.error) {
        Alert.alert("Error", result.error.message || "Sign up failed");
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
    <ScrollView className="flex-1">
      <View className="gap-6 p-5">
        <View className="gap-2">
          <Text className="text-foreground text-2xl font-bold">Sign Up</Text>
          <Text className="text-muted-foreground text-sm">
            Create a new account to get started
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-foreground text-sm font-medium">Name</Text>
            <Input
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-sm font-medium">Email</Text>
            <Input
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
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
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-sm font-medium">Confirm Password</Text>
            <Input
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <Button
            onPress={handleSubmit}
            disabled={isLoading || !name || !email || !password || !confirmPassword}
            size="lg"
            className="mt-2"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Sign Up</Text>
            )}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};
