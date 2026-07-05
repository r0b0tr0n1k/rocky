import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "expo-router";

const HEALTH_ACTIONS = [
  { title: "Record Vaccination", route: "/health/vaccination", desc: "Log a vaccine administered to an animal" },
  { title: "Record Treatment", route: "/health/treatment", desc: "Log a medical treatment or diagnosis" },
  { title: "Record Lab Test", route: "/health/lab-test", desc: "Log laboratory test results" },
];

export default function HealthIndexScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-foreground text-xl font-bold">Health Records</Text>
      {HEALTH_ACTIONS.map((action) => (
        <TouchableButton key={action.title} {...action} router={router} />
      ))}
    </View>
  );
}

function TouchableButton({ title, route, desc, router }: { title: string; route: string; desc: string; router: ReturnType<typeof useRouter> }) {
  return (
    <TouchableOpacity onPress={() => router.push(route)}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-muted-foreground text-sm">{desc}</Text>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}
