import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc-provider";
import { useOffline } from "@/providers/offline-provider";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { notifyError, notifySuccess } from "@/lib/notify";
import { INSPECTION_STATUS } from "@rocky/validators/enums";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inspection, isLoading } = trpc.inspection.getById.useQuery({ id });
  const [inspectionDate, setInspectionDate] = useState("");
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueInspection = useOfflineMutation("inspection");

  // `complete` carries only class-level `@Policy({ authenticated: true })` on
  // the server — there is no `inspection:*` action literal in the Permission
  // union, so there is nothing to gate against client-side. Every authenticated
  // principal may complete; the offline outbox + server re-validation guard it.
  const completeInspection = trpc.inspection.complete.useMutation({
    onSuccess: () => {
      notifySuccess("Inspection completed");
      utils.inspection.list.invalidate();
      router.back();
    },
    onError: (error) => { notifyError(error); },
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
                // Offline-first: write-local-then-enqueue (WO-082). The server
                // re-validates @Policy + RLS and, on completion, archives the
                // form (3-year retention, fire-and-forget — not reflected in the
                // response, so no separate archived-out toast from the client).
                if (!onlineManager.isOnline()) {
                  if (deviceId) void enqueueInspection({ id, inspectionDate });
                  notifySuccess("Inspection completed");
                  utils.inspection.list.invalidate();
                  router.back();
                  return;
                }
                completeInspection.mutate({ id, inspectionDate });
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
