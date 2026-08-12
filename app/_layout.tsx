import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, LogBox } from 'react-native';
import '../global.css';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/components/auth/AuthProvider';

// Expo SDK 53+ throws a console.error when expo-notifications is imported in Expo Go on Android.
// Since we manually detect Expo Go and fallback to local notifications in our NotificationService,
// we can safely suppress this red screen during development.
if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    'expo-notifications: Android Push notifications (remote notifications)',
  ]);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8F5EF' },
                animation: 'fade',
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
