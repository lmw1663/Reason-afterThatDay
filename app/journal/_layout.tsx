import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

/**
 * 일기 작성 흐름 레이아웃.
 * 정책: 단계 진행형 흐름은 모두 slide_from_right (분석/나침반/졸업/유예와 통일).
 * 루트(`app/_layout.tsx`)는 fade — 탭/모달성 진입에만 사용.
 */
export default function JournalLayout() {
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
