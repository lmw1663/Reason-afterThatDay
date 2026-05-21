import { forwardRef } from 'react';
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { motion } from '@/constants/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  /**
   * 컨테이너 스타일. Pressable의 함수형 style은 지원하지 않음 — scale/opacity는
   * 본 컴포넌트가 spring으로 처리하니 호출자는 정적 스타일만 넘기면 됨.
   */
  style?: StyleProp<ViewStyle>;
  /** 누름 시 축소 비율 (기본 0.97). 작은 칩에서 0.95로 살짝 더 줘도 됨. */
  pressScale?: number;
  /** 누름 시 불투명도 (기본 0.92). */
  pressOpacity?: number;
}

/**
 * Pressable + Reanimated spring 누름 피드백.
 *
 * NativeWind `active:opacity-80`보다 자연스러운 spring 감속을 제공.
 * 카드/CTA/큰 버튼에 적용. 작은 텍스트 링크는 hitSlop 위주로 처리.
 */
export const AnimatedPressable = forwardRef<View, Props>(function AnimatedPressable(
  { style, pressScale = 0.97, pressOpacity = 0.92, onPressIn, onPressOut, children, disabled, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      ref={ref}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(pressScale, motion.spring.press);
          opacity.value = withSpring(pressOpacity, motion.spring.press);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, motion.spring.press);
        opacity.value = withSpring(1, motion.spring.press);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
});
