import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useDecisionLockGuard } from '@/hooks/useDecisionLockGuard';

export default function AnalysisLayout() {
  const lock = useDecisionLockGuard();

  if (lock === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple[400]} />
      </View>
    );
  }
  if (lock === 'locked') return <Redirect href="/safety/release" />;

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
