import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';

type Size = 'hero' | 'row';
type Border = 'default' | 'purple' | 'teal';

const BORDER_COLOR: Record<Border, string> = {
  default: colors.border,
  purple: colors.borderPurpleSoft,
  teal: colors.borderTealSoft,
};

interface Props {
  onPress: () => void;
  accessibilityLabel: string;
  /** hero = radius.xl·p20·minH124 (탭 대표 카드) / row = radius.lg·p16 (목록 행·배너) */
  size?: Size;
  /** 카드 보더 틴트 — borderXxxSoft 토큰(Tier 0-2)만 허용 */
  border?: Border;
  disabled?: boolean;
  /** 내부 레이아웃 보강 (flexDirection·gap 등). 카드 chrome(배경/보더/radius)은 덮지 말 것. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * 눌리는 카드 — `Card`(정적)와 짝을 이루는 pressable 변형 (Tier 3-3).
 *
 * records/me 탭 등에서 인라인으로 재작성되던
 * `AnimatedPressable + surface 배경 + 1px 보더 + radius` chrome을 단일화한다.
 * 진입 stagger 애니메이션은 호출자가 Animated.View로 감싸는 기존 패턴 유지.
 */
export function PressableCard({
  onPress,
  accessibilityLabel,
  size = 'row',
  border = 'default',
  disabled,
  style,
  children,
}: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: BORDER_COLOR[border],
          borderRadius: size === 'hero' ? radius.xl : radius.lg,
          padding: size === 'hero' ? 20 : 16,
          ...(size === 'hero' ? { minHeight: 124 } : null),
        },
        style,
      ]}
    >
      {/* disabled 흐림(0.5)은 AnimatedPressable의 animatedStyle이 disabled prop으로 처리 —
          정적 style opacity는 spring opacity에 항상 덮여 무효였던 선재 버그를 그쪽에서 해소.
          accessibilityState(disabled)는 RN Pressable이 disabled prop에서 자동 merge. */}
      {children}
    </AnimatedPressable>
  );
}
