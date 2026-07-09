import type { ReactNode } from "react";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
  nativeID?: string;
};

/** Consistent label + control + inline error layout for typed forms. */
export function FormField({ label, error, children, nativeID }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Label nativeID={nativeID}>{label}</Label>
      {children}
      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
    </View>
  );
}
