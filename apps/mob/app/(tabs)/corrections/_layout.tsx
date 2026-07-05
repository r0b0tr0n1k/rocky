import { Stack } from "expo-router";

export default function CorrectionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Corrections" }} />
      <Stack.Screen name="[id]" options={{ title: "Correction Detail" }} />
    </Stack>
  );
}
