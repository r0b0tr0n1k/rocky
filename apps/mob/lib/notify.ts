import { toast } from "burnt";

/**
 * Mobile counterpart of `apps/web/lib/notify.ts` (ADR-0042 / WO-088).
 * `burnt` is the React-Native toast by the same author as react-native-reusables;
 * `sonner` is DOM-only and cannot run on RN, so the *idiom* is mirrored here so
 * feature code reads identically across surfaces (ADR-0052).
 */
export function notifySuccess(message: string) {
  toast({ title: message, preset: "done" });
}

/** Fire an error toast, falling back to a generic message. */
export function notifyError(error: unknown, fallback = "Something went wrong") {
  toast({
    title: error instanceof Error ? error.message : fallback,
    preset: "error",
  });
}
