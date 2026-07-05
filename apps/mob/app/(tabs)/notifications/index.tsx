import { useState } from "react";
import { View, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/providers/trpc-provider";

export default function NotificationsScreen() {
  const [notificationId, setNotificationId] = useState("");
  const { data: unreadCount, refetch } = trpc.notification.unreadCount.useQuery();
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => { refetch(); setNotificationId(""); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Unread Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-foreground text-4xl font-bold text-center">
            {unreadCount?.count ?? 0}
          </Text>
        </CardContent>
      </Card>

      <View className="gap-2">
        <Text className="text-foreground text-sm font-medium">Mark as Read</Text>
        <Input
          placeholder="Notification ID"
          value={notificationId}
          onChangeText={setNotificationId}
        />
        <Button
          onPress={() => markAsRead.mutate({ id: notificationId })}
          disabled={!notificationId || markAsRead.isPending}
        >
          <Text>Mark as Read</Text>
        </Button>
      </View>
    </View>
  );
}
