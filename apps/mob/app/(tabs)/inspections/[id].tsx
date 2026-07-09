import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc-provider";
import { INSPECTION_STATUS } from "@rocky/validators/enums";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inspection, isLoading } = trpc.inspection.getById.useQuery({ id });
  const [inspectionDate, setInspectionDate] = useState("");
  const utils = trpc.useUtils();

  const completeInspection = trpc.inspection.complete.useMutation({
    onSuccess: () => {
      utils.inspection.list.invalidate();
      router.back();
    },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4 gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </View>
    );
  }

  if (!inspection) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-destructive">Not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Inspection {id.slice(0, 8)}</CardTitle></CardHeader>
          <CardContent className="gap-3">
            <Row label="Status" value={inspection.status} />
            <Row label="Farm ID" value={inspection.farmId} />
            <Row label="Scheduled" value={inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleDateString() : "N/A"} />
            {inspection.notes ? <Row label="Notes" value={inspection.notes} /> : null}
          </CardContent>
        </Card>

        {inspection.status !== INSPECTION_STATUS.COMPLETED && (
          <View className="gap-4">
            <Text className="text-foreground text-lg font-bold">Complete Inspection</Text>
            <View className="gap-2">
              <Label nativeID="date">Inspection Date (YYYY-MM-DD)</Label>
              <Input placeholder="2026-01-15" value={inspectionDate} onChangeText={setInspectionDate} />
            </View>
            <Button
              onPress={() => {
                if (!inspectionDate) { Alert.alert("Error", "Enter inspection date"); return; }
                completeInspection.mutate({ id, inspectionDate: inspectionDate });
              }}
              disabled={completeInspection.isPending || !inspectionDate}
            >
              <Text>Complete Inspection</Text>
            </Button>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className="text-foreground font-medium">{value}</Text>
    </View>
  );
}
