import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { TRPCProvider } from '@/providers/trpc-provider';
import { PermissionsProvider } from '@/providers/permissions-provider';
import { SessionProvider } from '@/providers/session-provider';
import { ActiveFarmProvider } from '@/providers/active-farm-provider';
import { OfflineProvider } from '@/providers/offline-provider';
import { NotificationProvider } from '@/providers/notification-provider';
import { getConfig } from '@/lib/config';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUniwind } from 'uniwind';
import { View, Text } from 'react-native';

export {
  ErrorBoundary,
} from 'expo-router';

function ConfigError({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background p-5">
      <Text className="text-destructive text-xl font-bold mb-3">Configuration Error</Text>
      <Text className="text-foreground text-base text-center mb-4">{message}</Text>
      <Text className="text-muted-foreground text-sm font-mono">
        Make sure you have a .env file with:{'\n'}
        EXPO_PUBLIC_API_URL
      </Text>
    </View>
  );
}

export default function RootLayout() {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    return (
      <ConfigError message={err instanceof Error ? err.message : 'Failed to load configuration'} />
    );
  }

  const { theme } = useUniwind();

  return (
    <TRPCProvider apiUrl={config.apiUrl}>
      <OfflineProvider>
      <SessionProvider>
        <NotificationProvider>
        <PermissionsProvider>
          <ActiveFarmProvider>
          <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <PortalHost />
        </ThemeProvider>
          </ActiveFarmProvider>
        </PermissionsProvider>
        </NotificationProvider>
      </SessionProvider>
      </OfflineProvider>
    </TRPCProvider>
  );
}
