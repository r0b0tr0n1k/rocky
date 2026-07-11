// Server-side Expo Push API client (WO-091, ADR-0043 §3).
//
// Emits push messages via Expo's Push API. Requires EXPO_ACCESS_TOKEN — the
// EAS project access token (generated in the Expo project settings). If the
// token is absent, emission is skipped: local dev has no push identity, but
// the in-app notification row still exists (pull works). Delivery is
// best-effort — failures are non-fatal and must never break `send`.

const EXPO_PUSH_URL = "https://expo.dev/api/v2/push/send";

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  const token = process.env.EXPO_ACCESS_TOKEN;
  if (!token || messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch {
    // best-effort delivery; a failed push must not surface to the caller
  }
}
