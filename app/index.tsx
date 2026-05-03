import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { isConsentValid } from '@/constants/consent';
import { colors } from '@/constants/colors';

/**
 * 첫 진입 라우터.
 *
 * 1) userId 준비 대기 (useAuth가 익명 가입 처리 중)
 * 2) 동의 미완료/구버전 → /onboarding/consent
 * 3) 동의 완료 + 온보딩 미완료 → /onboarding/login (또는 이별 날짜로)
 * 4) 모두 완료 → /(tabs)
 *
 * NOTE: A-2 OAuth가 들어오면 익명 가입 → OAuth 전환 흐름이 추가된다.
 * 현재는 익명 가입 baseline 위에서 동의 화면만 강제한다.
 */
export default function Index() {
  const { userId, consentVersions, onboardingCompleted } = useUserStore();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    // useAuth의 익명 가입에 짧은 시간이 필요. 1초 grace.
    const t = setTimeout(() => setWaited(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!userId && !waited) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple[400]} />
      </View>
    );
  }

  if (!isConsentValid(consentVersions ?? null)) {
    return <Redirect href="/onboarding/consent" />;
  }

  if (!onboardingCompleted) {
    // A-2 구현 시 /onboarding/login으로 변경. 현재는 기존 이별 날짜 화면으로 직행.
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
