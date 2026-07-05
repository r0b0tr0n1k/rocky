import { useState, useEffect } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Network from "expo-network";

export default function SyncScreen() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState("");

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    const state = await Network.getNetworkStateAsync();
    setIsConnected(state.isConnected ?? false);
    setNetworkType(state.type ?? "unknown");
  };

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">Connection</Text>
            <Badge variant={isConnected ? "default" : "destructive"}>
              <Text className="text-xs">{isConnected ? "Online" : "Offline"}</Text>
            </Badge>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Type</Text>
            <Text className="text-foreground font-medium">{networkType || "Unknown"}</Text>
          </View>
        </CardContent>
      </Card>

      <Button onPress={checkNetwork}>
        <Text>Refresh Status</Text>
      </Button>

      <Text className="text-muted-foreground text-sm text-center mt-4">
        Offline sync queue is not yet implemented.
      </Text>
    </View>
  );
}
