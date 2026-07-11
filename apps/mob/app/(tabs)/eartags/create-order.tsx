import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { onlineManager } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc-provider";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useOffline } from "@/providers/offline-provider";
import { useCan } from "@/providers/permissions-provider";
import { useRouter } from "expo-router";
import { notifyError, notifySuccess } from "@/lib/notify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { createOrderRequestSchema } from "@rocky/validators/api";
import { z } from "zod";

// Rebuilt from `createOrderRequestSchema.shape` (single source of truth) so the
// form validates against the canonical API schema. `quantity` is adapted to a
// string input and coerced at submit; server-only fields are omitted.
const createOrderFormSchema = z
  .object(createOrderRequestSchema.shape)
  .omit({ farmId: true, description: true, idempotencyKey: true })
  .extend({
    quantity: z
      .string()
      .min(1, "Quantity is required")
      .refine((v) => /^\d+$/.test(v), "Quantity must be a whole number"),
  });

type CreateOrderForm = {
  organizationId: string;
  supplierOrganizationId: string;
  supplierName: string;
  quantity: string;
};

export default function CreateOrderScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { deviceId } = useOffline();
  const enqueueOrder = useOfflineMutation("earTag");
  const canCreateOrder = useCan("eartag:order");

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderFormSchema) as Resolver<CreateOrderForm>,
    mode: "onTouched",
    defaultValues: {
      organizationId: "",
      supplierOrganizationId: "",
      supplierName: "",
      quantity: "",
    },
  });

  const createOrder = trpc.earTag.createOrder.useMutation({
    onSuccess: () => {
      notifySuccess("Ear tag order created");
      utils.earTag.listOrders.invalidate();
      router.back();
    },
    onError: (error) => {
      notifyError(error);
    },
  });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      organizationId: values.organizationId,
      supplierOrganizationId: values.supplierOrganizationId,
      supplierName: values.supplierName,
      quantity: Number(values.quantity),
    };
    if (!onlineManager.isOnline()) {
      // Offline: write-local-then-enqueue (WO-082). The outbox drains on
      // reconnect; the Server re-validates @Policy + RLS.
      if (deviceId) void enqueueOrder(payload);
      notifySuccess("Order saved locally — will sync when online");
      utils.earTag.listOrders.invalidate();
      router.back();
      return;
    }
    createOrder.mutate(payload);
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        <FormField label="Organization ID" error={errors.organizationId?.message} nativeID="orgId">
          <Input
            placeholder="UUID"
            value={watch("organizationId")}
            onChangeText={(t) => setValue("organizationId", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField
          label="Supplier Organization ID"
          error={errors.supplierOrganizationId?.message}
          nativeID="supplierOrgId"
        >
          <Input
            placeholder="UUID"
            value={watch("supplierOrganizationId")}
            onChangeText={(t) => setValue("supplierOrganizationId", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Supplier Name" error={errors.supplierName?.message} nativeID="supplierName">
          <Input
            placeholder="Supplier name"
            value={watch("supplierName")}
            onChangeText={(t) => setValue("supplierName", t, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Quantity" error={errors.quantity?.message} nativeID="quantity">
          <Input
            placeholder="Number of tags"
            value={watch("quantity")}
            onChangeText={(t) => setValue("quantity", t, { shouldValidate: true })}
            keyboardType="numeric"
          />
        </FormField>

        {!canCreateOrder ? (
          <Text className="text-sm text-muted-foreground">
            You don't have permission to place ear tag orders.
          </Text>
        ) : !onlineManager.isOnline() ? (
          <Text className="text-sm text-muted-foreground">
            Offline — the order is saved locally and syncs when you reconnect.
          </Text>
        ) : null}

        <Button onPress={onSubmit} disabled={isSubmitting || !canCreateOrder} size="lg">
          {isSubmitting ? <ActivityIndicator color="white" /> : <Text>Create Order</Text>}
        </Button>
      </View>
    </ScrollView>
  );
}
