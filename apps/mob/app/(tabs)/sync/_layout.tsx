import { Stack } from "expo-router";

export default function SyncLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Sync Status" }} />
    </Stack>
  );
}
