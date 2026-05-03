import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { isLateNightPushSuppressed } from '@/constants/personaBranches';
import { AppError } from '@/constants/errors';

/**
 * Push notification handler.
 *
 * C-2-Ref-3: 페르소나별 새벽 푸시 차단 (참고용 §2 P3).
 *  - 불안형(P03) 사용자가 새벽 시간대에 푸시 받으면 충동 자극 위험
 *  - notification.data.kind === 'crisis'는 *위기 자원 푸시*로 항상 통과 (B-1 정책)
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const persona = usePersonaStore.getState().primary;
    const hour = new Date().getHours();
    const kind = notification.request.content.data?.kind as string | undefined;
    const isCrisisPush = kind === 'crisis';

    if (!isCrisisPush && isLateNightPushSuppressed(persona, hour)) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
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
