import { Stack } from "expo-router";

export default function MovementsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Movements" }} />
      <Stack.Screen name="death" options={{ title: "Record Death" }} />
      <Stack.Screen name="pasture" options={{ title: "Pasture Declaration" }} />
      <Stack.Screen name="slaughter" options={{ title: "Record Slaughter" }} />
    </Stack>
  );
}
