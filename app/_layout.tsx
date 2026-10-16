import '../global.css';
import { colors } from '@/constants/colors';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useQuestionPool } from '@/hooks/useQuestionPool';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { usePersonaReclassify } from '@/hooks/usePersonaReclassify';

// NativeWind v4가 Pressable active: 클래스를 Reanimated로 처리하는 과정에서 발생하는 라이브러리 경고
LogBox.ignoreLogs([
  "It looks like you might be using shared value's .value inside reanimated inline style",
]);

// Pretendard 로딩 전까지 splash 유지. Variable 폰트(6.4MB)라 첫 부팅엔 약간 대기.
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppBootstrap() {
  useAuth();
  useQuestionPool();
  usePushNotifications();
  useOfflineSync();
  usePersonaReclassify();
  return null;
}

export default function RootLayout() {
  // fontError까지 받아 폰트 로딩 실패 시 system font로 fallback (무한 splash 방지)
  const [fontsLoaded, fontError] = useFonts({
    Pretendard: require('../assets/fonts/PretendardVariable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="light" />
      <AppBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      />
    </>
  );
}
