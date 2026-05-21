import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { motion } from '@/constants/motion';

/**
 * 카드 묶음 stagger 진입 — 각 카드가 N*gap 지연 후 fadeUp.
 *
 * Reanimated SharedValue 배열을 반환할 수 없는 hooks 규칙에 따라, 호출자는
 * `useStaggerItem(index)`를 반복 호출하는 패턴 권장. 본 훅은 한 카드 단위.
 *
 * 사용:
 *   const heroStyle = useStaggerEntrance(0);
 *   const gridStyle = useStaggerEntrance(1);
 *   <Animated.View style={heroStyle}>...</Animated.View>
 */
export function useStaggerEntrance(index: number, gapMs: number = motion.duration.stagger) {
  // ScreenWrapper가 이미 translateY 8→0을 처리하므로 자식 stagger는 4→0으로 축소.
  // 부모·자식 translateY가 누적돼 카드가 의도보다 멀리서 미끄러져 들어오는 인상 방지.
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);

  useEffect(() => {
    const delay = index * gapMs;
    opacity.value = withDelay(delay, withSpring(1, motion.spring.standard));
    translateY.value = withDelay(delay, withSpring(0, motion.spring.standard));
  }, [index, gapMs, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}
