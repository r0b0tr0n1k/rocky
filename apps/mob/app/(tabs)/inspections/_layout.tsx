import { Stack } from "expo-router";

export default function InspectionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Inspections" }} />
      <Stack.Screen name="[id]" options={{ title: "Inspection Detail" }} />
    </Stack>
  );
}
