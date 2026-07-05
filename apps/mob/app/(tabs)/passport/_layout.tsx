import { Stack } from "expo-router";

export default function PassportLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Passports" }} />
      <Stack.Screen name="[id]" options={{ title: "Passport Detail" }} />
    </Stack>
  );
}
