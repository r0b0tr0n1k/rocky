import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc-provider";
import { useRouter } from "expo-router";

export default function CreateOrderScreen() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [supplierOrgId, setSupplierOrgId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("");

  const createOrder = trpc.earTag.createOrder.useMutation({
    onSuccess: () => { router.back(); },
    onError: (e) => { Alert.alert("Error", e.message); },
  });

  const handleSubmit = async () => {
    if (!organizationId || !supplierOrgId || !supplierName || !quantity) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    try {
      await createOrder.mutateAsync({
        organizationId, supplierOrganizationId: supplierOrgId,
        supplierName, quantity: parseInt(quantity, 10),
      });
    } catch {}
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <View className="gap-2">
          <Label nativeID="orgId">Organization ID</Label>
          <Input placeholder="UUID" value={organizationId} onChangeText={setOrganizationId} />
        </View>
        <View className="gap-2">
          <Label nativeID="supplierOrgId">Supplier Organization ID</Label>
          <Input placeholder="UUID" value={supplierOrgId} onChangeText={setSupplierOrgId} />
        </View>
        <View className="gap-2">
          <Label nativeID="supplierName">Supplier Name</Label>
          <Input placeholder="Supplier name" value={supplierName} onChangeText={setSupplierName} />
        </View>
        <View className="gap-2">
          <Label nativeID="quantity">Quantity</Label>
          <Input placeholder="Number of tags" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>
        <Button onPress={handleSubmit} disabled={createOrder.isPending} size="lg">
          <Text>Create Order</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
