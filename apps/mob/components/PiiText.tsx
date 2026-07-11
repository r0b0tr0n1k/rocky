import { useState } from "react";
import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { maskValue } from "@/lib/offline/pii";

export interface PiiTextProps {
  /** The underlying value to display. */
  value: string;
  /** Whether this field is PII for the current entity type (from the server descriptor). */
  pii?: boolean;
  /** Caller-resolved: does the current principal hold pii:read? */
  canReveal?: boolean;
  /** Required processing purpose before reveal (Art.5(1)(b) purpose limitation). */
  purpose?: string;
  /** Called after a successful reveal so the caller can ship a reveal event to the audit log. */
  onReveal?: (purpose: string) => void;
}

/**
 * Mask-by-default PII text (ADR-0061 D5 mobile analog).
 *
 *  - Non-PII: rendered as-is.
 *  - PII + no reveal right: masked, no affordance (the cheapest leak is the one never shown).
 *  - PII + reveal right: masked until tapped; on reveal we invoke onReveal so the
 *    caller can forward the event through the outbox to the tamper-evident server log.
 *
 * The component is deliberately dumb: it knows nothing about the registry. The caller
 * decides `pii` from the server-provided descriptor and `canReveal` from useCan("pii:read").
 */
export function PiiText({ value, pii = false, canReveal = false, purpose, onReveal }: PiiTextProps) {
  const [revealed, setRevealed] = useState(false);

  if (!pii) return <Text>{value}</Text>;
  if (!canReveal) return <Text className="text-muted-foreground">{maskValue(value)}</Text>;

  if (!revealed) {
    return (
      <Pressable
        onPress={() => {
          setRevealed(true);
          onReveal?.(purpose ?? "unspecified");
        }}
      >
        <Text className="text-muted-foreground italic">{maskValue(value)} &middot; tap to reveal</Text>
      </Pressable>
    );
  }
  return <Text>{value}</Text>;
}
