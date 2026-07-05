import { Stack } from "expo-router";
import { Text } from "@/components/ui/text";

export default function AnimalsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Animals" }} />
      <Stack.Screen name="search" options={{ title: "Search Animal" }} />
      <Stack.Screen name="[id]" options={{ title: "Animal Detail" }} />
      <Stack.Screen name="create" options={{ title: "Register Animal" }} />
      <Stack.Screen name="birth" options={{ title: "Birth Notification" }} />
    </Stack>
  );
}
