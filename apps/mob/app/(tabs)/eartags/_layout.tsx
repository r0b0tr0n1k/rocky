import { Stack } from "expo-router";

export default function EarTagsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Ear Tag Orders" }} />
      <Stack.Screen name="create-order" options={{ title: "Create Order" }} />
      <Stack.Screen name="collect-tags" options={{ title: "Collect Tags" }} />
    </Stack>
  );
}
