import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

export default function CollectTagsScreen() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [supplierOrgId, setSupplierOrgId] = useState("");

  const collectTags = trpc.earTag.collectOrderTags.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const handleSubmit = async () => {
    if (!orderId || !supplierOrgId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await collectTags.mutateAsync({ orderId, supplierOrganizationId: supplierOrgId });
    } catch {}
  };

  return (
    <ScrollView className="flex-1 bg-background">
    <Card className="m-4">
      <CardContent className="gap-4 p-4">
        <View className="gap-2">
          <Label nativeID="orderId">Order ID</Label>
          <Input placeholder="UUID of the order" value={orderId} onChangeText={setOrderId} />
        </View>
        <View className="gap-2">
          <Label nativeID="supplierOrgId">Supplier Organization ID</Label>
          <Input placeholder="UUID" value={supplierOrgId} onChangeText={setSupplierOrgId} />
        </View>
        <Button onPress={handleSubmit} disabled={collectTags.isPending} size="lg">
          <Text>Collect Tags</Text>
        </Button>
      </CardContent>
      </Card>
    </ScrollView>
  );
}
