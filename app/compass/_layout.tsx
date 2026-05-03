import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useDecisionLockGuard } from '@/hooks/useDecisionLockGuard';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getCompassGateDays,
  isCompassDisabledByPersona,
} from '@/constants/personaBranches';

/**
 * 나침반 진입 가드 — A-5(잠금) + C-2-G-4(페르소나 게이트).
 *
 * 두 단계:
 *  1. C-SSRS 잠금: decisionLocked → /safety/release
 *  2. 페르소나 게이트:
 *     - P17(강제 이별) 영구 비활성 → /(tabs)/me
 *     - 페르소나별 D+N 미달(P02=10·P04=14·P07=21) → /(tabs)/me
 *
 * me.tsx 카드 게이트와 별개로 deep link·북마크·잔존 push 모두 차단.
 */
export default function CompassLayout() {
  const lock = useDecisionLockGuard();
  const daysElapsed = useUserStore(s => s.daysElapsed);
  const personaPrimary = usePersonaStore(s => s.primary);

  if (lock === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple[400]} />
      </View>
    );
  }
  if (lock === 'locked') return <Redirect href="/safety/release" />;

  if (isCompassDisabledByPersona(personaPrimary)) {
    return <Redirect href="/(tabs)/me" />;
  }
  if (daysElapsed < getCompassGateDays(personaPrimary)) {
    return <Redirect href="/(tabs)/me" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
