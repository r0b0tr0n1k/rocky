import { useEffect } from "react";

export function useMountEffect(effect: () => undefined | (() => void)) {
  useEffect(effect, [effect]);
}
