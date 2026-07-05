import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc-provider";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function CorrectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: correction, isLoading } = trpc.correction.getById.useQuery({ id });
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [escalateTo, setEscalateTo] = useState("");
  const utils = trpc.useUtils();

  const review = trpc.correction.review.useMutation({
    onSuccess: () => { utils.correction.list.invalidate(); router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });
  const resolve = trpc.correction.resolve.useMutation({
    onSuccess: () => { utils.correction.list.invalidate(); router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });
  const escalate = trpc.correction.escalate.useMutation({
    onSuccess: () => { utils.correction.list.invalidate(); router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  if (isLoading) return <View className="flex-1 bg-background p-4 gap-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></View>;
  if (!correction) return <View className="flex-1 items-center justify-center"><Text className="text-destructive">Not found</Text></View>;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-xl font-bold">{correction.errorType}</Text>
          <Badge><Text className="text-xs">{correction.status}</Text></Badge>
        </View>

        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="gap-3">
            <Row label="Description" value={correction.errorDescription} />
            <Row label="Source" value={correction.detectionSource} />
            <Row label="Farm ID" value={correction.farmId ?? "N/A"} />
            <Row label="Animal ID" value={correction.animalId ?? "N/A"} />
            {correction.resolutionNotes && <Row label="Resolution" value={correction.resolutionNotes} />}
          </CardContent>
        </Card>

        {correction.status === "pending" && (
          <Button onPress={() => review.mutate({ id })} disabled={review.isPending}>
            <Text>Mark Under Review</Text>
          </Button>
        )}

        {(correction.status === "pending" || correction.status === "under_review") && (
          <View className="gap-4">
            <View className="gap-2">
              <Label>Resolution Notes</Label>
              <Input placeholder="Notes" value={resolutionNotes} onChangeText={setResolutionNotes} />
            </View>
            <Button onPress={() => resolve.mutate({ id, resolutionNotes: resolutionNotes || undefined })} disabled={resolve.isPending}>
              <Text>Resolve</Text>
            </Button>
            <View className="gap-2">
              <Label>Escalate To (User ID)</Label>
              <Input placeholder="UUID" value={escalateTo} onChangeText={setEscalateTo} />
            </View>
            <Button
              variant="destructive"
              onPress={() => { if (!escalateTo) { Alert.alert("Error", "Enter user ID"); return; } escalate.mutate({ id, escalatedTo: escalateTo }); }}
              disabled={escalate.isPending || !escalateTo}
            >
              <Text>Escalate</Text>
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
      <Text className="text-foreground font-medium flex-1 text-right">{value}</Text>
    </View>
  );
}
