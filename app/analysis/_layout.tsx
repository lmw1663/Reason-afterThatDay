import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useDecisionLockGuard } from '@/hooks/useDecisionLockGuard';
import { usePersonaStore } from '@/store/usePersonaStore';
import { isAnalysisTrackBlockedByPersona } from '@/constants/personaBranches';

/**
 * 분석 진입 가드 — A-5(잠금) + C-2-G-6(페르소나 차단).
 *
 * 두 단계:
 *  1. C-SSRS 잠금: decisionLocked → /safety/release
 *  2. 페르소나 차단: P01·P14·P20 → /(tabs)/me (about-me로 우회 안내)
 *
 * me.tsx 카드 게이트와 별개로 deep link·북마크·잔존 push 모두 차단.
 */
export default function AnalysisLayout() {
  const lock = useDecisionLockGuard();
  const personaPrimary = usePersonaStore(s => s.primary);

  if (lock === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple[400]} />
      </View>
    );
  }
  if (lock === 'locked') return <Redirect href="/safety/release" />;

  if (isAnalysisTrackBlockedByPersona(personaPrimary)) {
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
