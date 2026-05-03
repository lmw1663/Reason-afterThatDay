import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { signInWithProvider, type OAuthProvider } from '@/api/auth';
import { useUserStore } from '@/store/useUserStore';
import { isConsentValid } from '@/constants/consent';

interface ProviderButton {
  provider: OAuthProvider;
  label: string;
  icon: IconName;
  bg: string;
  fg: string;
  iosOnly?: boolean;
}

// 한국 한정 출시 — 카카오를 1순위(한국 메인 OAuth)로 노출
const PROVIDERS: ProviderButton[] = [
  { provider: 'kakao',  label: '카카오로 시작하기', icon: 'message-circle', bg: '#FEE500', fg: '#191919' },
  { provider: 'apple',  label: 'Apple로 시작하기',  icon: 'apple',          bg: '#000000', fg: '#FFFFFF', iosOnly: true },
  { provider: 'google', label: 'Google로 시작하기', icon: 'globe',          bg: '#FFFFFF', fg: '#111111' },
];

export default function LoginScreen() {
  const { consentVersions } = useUserStore();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  // 가드: deep link 등으로 직접 진입한 경우 약관 동의 화면으로 우회
  if (!isConsentValid(consentVersions ?? null)) {
    return <Redirect href="/onboarding/consent" />;
  }

  async function handleLogin(provider: OAuthProvider) {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      const { session } = await signInWithProvider(provider);
      if (!session) throw new Error('세션을 받지 못했어');
      router.replace('/onboarding' as never);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '로그인에 실패했어';
      Alert.alert('잠깐만', message);
    } finally {
      setLoadingProvider(null);
    }
  }

  const visibleProviders = PROVIDERS.filter(p => !p.iosOnly || Platform.OS === 'ios');

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-24">
        <Caption className="mb-2">reason</Caption>
        <Display className="mb-2">천천히 들여다보자</Display>
        <Body className="text-gray-400 mb-12">
          로그인하면 네 기록이 다음에 다시 돌아왔을 때도 그대로 있어.
        </Body>
      </View>

      <View className="px-6 pb-10 gap-3">
        {visibleProviders.map(p => (
          <Pressable
            key={p.provider}
            onPress={() => handleLogin(p.provider)}
            accessibilityRole="button"
            accessibilityLabel={p.label}
            disabled={loadingProvider !== null}
            className="rounded-2xl py-4 px-5 flex-row items-center justify-center gap-3 active:opacity-80"
            style={{ backgroundColor: p.bg, opacity: loadingProvider && loadingProvider !== p.provider ? 0.4 : 1 }}
          >
            <Icon name={p.icon} size={20} color={p.fg} />
            <Body style={{ color: p.fg, fontWeight: '600' }}>
              {loadingProvider === p.provider ? '연결 중...' : p.label}
            </Body>
          </Pressable>
        ))}

        <Caption className="text-center text-gray-500 mt-3 leading-5">
          시작하면 이미 동의한 약관에 따라 계정이 만들어져.
        </Caption>
      </View>
    </ScreenWrapper>
  );
}
