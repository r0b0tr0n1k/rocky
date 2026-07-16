import { Stack } from "expo-router";

export default function HealthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Health" }} />
      <Stack.Screen name="vaccine" options={{ title: "Vaccines" }} />
      <Stack.Screen name="vaccine/create" options={{ title: "Record Vaccination" }} />
      <Stack.Screen name="treatment" options={{ title: "Treatments" }} />
      <Stack.Screen name="treatment/create" options={{ title: "Record Treatment" }} />
      <Stack.Screen name="lab-test" options={{ title: "Lab Tests" }} />
      <Stack.Screen name="lab-test/create" options={{ title: "Record Lab Test" }} />
    </Stack>
  );
}
