// Notification provider (WO-091 + WO-093, ADR-0043).
//
// - Registers the Expo push token on login and persists it to the server
//   (so the Big Other can finally address the field worker in the field).
// - Routes incoming notifications / deep links to the right screen, with
//   offline-parity: a background fetch is triggered before navigating so the
//   target entity is fresh (Skeleton/Empty handles the miss, ADR-0041).

import { useEffect, type ReactNode } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useSession } from "@/providers/session-provider";
import { useOffline } from "@/providers/offline-provider";
import { trpc } from "@/providers/trpc-provider";
import { getDeviceId } from "@/lib/offline/device-id";
import { IS_WEB } from "@/lib/offline/db";
import { navigateToRoute } from "@/lib/deep-link";

// Surface foreground notifications as banners; the listener below routes them.
// Native-only: web has no notification subsystem, so skip configuring a handler
// that would otherwise touch a native module which does not exist on web.
if (!IS_WEB) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

async function registerForPushAsync(): Promise<string | null> {
  if (IS_WEB) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { download } = useOffline();
  const registerDevice = trpc.notification.registerDevice.useMutation();

  // Register the Expo push token on login (WO-091).
  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    (async () => {
      const token = await registerForPushAsync();
      if (!token || !active) return;
      const deviceId = await getDeviceId();
      registerDevice.mutate({
        deviceId,
        expoPushToken: token,
        platform: Platform.OS as "ios" | "android",
      });
    })();
    return () => {
      active = false;
    };
  }, [session?.user, registerDevice]);

  // Foreground: notification received → route. Native-only (web has no
  // notification delivery), so skip the listener entirely on web.
  useEffect(() => {
    if (IS_WEB) return;
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const route = n.request.content.data?.route as string | undefined;
      if (route) download();
      navigateToRoute(route);
    });
    return () => sub.remove();
  }, [download]);

  // App opened from a tapped notification → route. Native-only: getLastNotificationResponse
  // has no web implementation, so the whole effect is skipped on web.
  useEffect(() => {
    if (IS_WEB) return;
    let active = true;
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (!active || !res) return;
      const route = res.notification.request.content.data?.route as string | undefined;
      if (route) download();
      navigateToRoute(route);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const route = res.notification.request.content.data?.route as string | undefined;
      if (route) download();
      navigateToRoute(route);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [download]);

  return <>{children}</>;
}
