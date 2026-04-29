import '../global.css';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuestionPool } from '@/hooks/useQuestionPool';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';

// NativeWind v4가 Pressable active: 클래스를 Reanimated로 처리하는 과정에서 발생하는 라이브러리 경고
LogBox.ignoreLogs([
  "It looks like you might be using shared value's .value inside reanimated inline style",
]);

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
