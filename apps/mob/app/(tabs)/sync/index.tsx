// Sync Control Center (WO-082 / ADR-0036 d8). The outbox is local SQLite;
// a global badge shows pending count; failures surface here with the
// server's error message. Dismissing deletes the local outbox item only — the
// server-side error_corrections ticket persists for a technician (ADR-0015).

import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/providers/offline-provider";

export default function SyncScreen() {
  const { isOnline, pendingCount, items, flush, download, dismiss, isBusy } = useOffline();
  const failed = items.filter((i) => i.status === "failed");
  const pending = items.filter((i) => i.status === "pending" || i.status === "syncing");

  const onSync = async () => {
    await download();
    await flush();
  };

  return (
    <ScrollView className="flex-1 bg-background p-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">Status</Text>
            <Badge variant={isOnline ? "default" : "destructive"}>
              <Text className="text-xs">{isOnline ? "Online" : "Offline"}</Text>
            </Badge>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">Pending</Text>
            <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
              <Text className="text-xs">{pendingCount}</Text>
            </Badge>
          </View>
        </CardContent>
      </Card>

      <Button onPress={onSync} disabled={!isOnline || isBusy}>
        <Text>{isOnline ? "Sync now" : "Offline — syncs on reconnect"}</Text>
      </Button>

      <Text className="text-muted-foreground text-sm mt-2">
        Outbox ({items.length})
      </Text>
      {items.length === 0 ? (
        <Text className="text-muted-foreground text-center mt-4">
          Nothing queued. All changes are synced.
        </Text>
      ) : (
        items.map((i) => (
          <Card key={i.idempotency_key}>
            <CardContent className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-medium capitalize">{i.type}</Text>
                <Badge
                  variant={
                    i.status === "failed"
                      ? "destructive"
                      : i.status === "synced"
                        ? "secondary"
                        : "default"
                  }
                >
                  <Text className="text-xs">{i.status}</Text>
                </Badge>
              </View>
              {i.status === "failed" && i.error_message ? (
                <Text className="text-destructive text-xs">{i.error_message}</Text>
              ) : null}
              {i.status === "failed" ? (
                <Button variant="outline" onPress={() => dismiss(i.idempotency_key)}>
                  <Text>Dismiss (keep server ticket)</Text>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
