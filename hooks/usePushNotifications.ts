import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { AppError } from '@/constants/errors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { userId, setPushToken } = useUserStore();

  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId, setPushToken);

    // 알림 탭 시 화면 이동
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const screen = res.notification.request.content.data?.screen as string | undefined;
      if (screen === 'cooling') router.push('/cooling');
      else if (screen === 'journal') router.push('/journal');
    });

    return () => sub.remove();
  }, [userId]);
}

async function registerForPushNotifications(
  userId: string,
  setPushToken: (token: string) => void,
) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn(AppError.PUSH_DENIED);
    return;
  }

  // EAS projectId — dev client/bare workflow에선 manifest에서 추론이 안 돼 명시 전달 필요.
  // 아직 `eas init`이 안 돼 있는 단계에선 projectId 없이 fallback (실패해도 앱이 죽지 않게).
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  let token: string | null = null;
  try {
    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = result.data;
  } catch (e) {
    console.warn('[push] getExpoPushTokenAsync failed:', e);
    return;
  }

  if (!token) return;

  setPushToken(token);
  await supabase.from('users').update({ push_token: token }).eq('id', userId);
}
