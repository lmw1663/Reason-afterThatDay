import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { AppError } from '@/constants/errors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  setPushToken(token);

  // DB에 토큰 저장
  await supabase.from('users').update({ push_token: token }).eq('id', userId);
}
