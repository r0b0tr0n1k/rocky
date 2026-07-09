import * as React from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

/**
 * React Native port of the shadcn `Empty` primitive (web: @rocky/ui empty.tsx).
 * API-parity with web so feature code reads identically across surfaces (ADR-0052).
 */
function Empty({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6",
        className
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: ViewProps) {
  return <View className={cn("flex max-w-sm flex-col items-center gap-2", className)} {...props} />;
}

function EmptyMedia({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("mb-2 flex size-8 items-center justify-center rounded-lg bg-muted", className)}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-sm font-medium tracking-tight", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function EmptyContent({ className, ...props }: ViewProps) {
  return <View className={cn("flex w-full max-w-sm flex-col items-center gap-2.5", className)} {...props} />;
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
