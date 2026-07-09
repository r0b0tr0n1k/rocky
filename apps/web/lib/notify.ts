import { toast } from "sonner";

/** Fire a success toast (used after a successful mutation). */
export function notifySuccess(message: string) {
  toast.success(message);
}

/** Fire an error toast, falling back to a generic message. */
export function notifyError(error: unknown, fallback = "Something went wrong") {
  toast.error(error instanceof Error ? error.message : fallback);
}
