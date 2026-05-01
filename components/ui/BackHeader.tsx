import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { Caption } from './Typography';
import { Icon } from './Icon';

interface Props {
  label?: string;
  onPress?: () => void;
}

/**
 * 흐름 중간 화면(일기/분석/나침반 등)의 표준 뒤로가기 헤더.
 *
 * 정책:
 *  - 흐름 중간 화면: BackHeader + router.back (직전 단계로)
 *  - 흐름 종료(결과/홈 복귀): replace('/(tabs)') — 뒤로가기 불필요
 *  - 탭 화면: 뒤로가기 없음 (최상위)
 */
export function BackHeader({ label = '뒤로', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      className="mb-4 self-start flex-row items-center gap-1"
      accessibilityRole="button"
      accessibilityLabel={`${label}로 가기`}
    >
      <Icon name="chevron-left" size={18} color={colors.gray[400]} />
      <View>
        <Caption className="text-base">{label}</Caption>
      </View>
    </Pressable>
  );
}
