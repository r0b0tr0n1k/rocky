import { type ComponentProps } from "react";

import { Badge } from "@rocky/ui/components/badge";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const DEFAULT_STATUS_MAP: Record<string, BadgeVariant> = {
  alive: "secondary",
  active: "secondary",
  completed: "secondary",
  registered: "secondary",
  pending: "outline",
  draft: "outline",
  inactive: "outline",
  seized: "destructive",
  cancelled: "destructive",
  slaughtered: "destructive",
  dead: "destructive",
};

export interface StatusBadgeProps {
  value: string;
  map?: Record<string, BadgeVariant>;
}

export function StatusBadge({ value, map }: StatusBadgeProps) {
  const variant = (map ?? DEFAULT_STATUS_MAP)[value] ?? "outline";
  return <Badge variant={variant}>{value}</Badge>;
}
