import { Stack } from "expo-router";

export default function HealthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Health" }} />
      <Stack.Screen name="vaccination" options={{ title: "Record Vaccination" }} />
      <Stack.Screen name="treatment" options={{ title: "Record Treatment" }} />
      <Stack.Screen name="lab-test" options={{ title: "Record Lab Test" }} />
    </Stack>
  );
}
