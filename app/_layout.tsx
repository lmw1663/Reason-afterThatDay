import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuestionPool } from '@/hooks/useQuestionPool';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';

function AppBootstrap() {
  useAuth();
  useQuestionPool();
  usePushNotifications();
  useOfflineSync();
  return null;
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AppBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0E12' },
          animation: 'fade',
        }}
      />
    </>
  );
}
