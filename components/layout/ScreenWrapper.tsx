import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors } from '@/constants/colors';
import { motion } from '@/constants/motion';

interface Props {
  children: React.ReactNode;
  safeArea?: boolean;
  style?: object;
  /**
   * TextInput이 있는 화면에서 키보드가 입력창을 가리지 않도록 처리.
   * 기본값: false (불필요한 레이아웃 비용 회피)
   */
  keyboardAvoiding?: boolean;
  /**
   * 진입 모션 (focus마다 spring 재생).
   *  - 'fadeUp' (기본): opacity + translateY(세로 8px) — 일반 화면
   *  - 'slide'        : opacity + translateX(가로) — 탭 전환을 옆으로 슬라이드
   *  - 'none'         : 모션 없음(정적)
   */
  entrance?: 'fadeUp' | 'slide' | 'none';
}

/**
 * 화면 진입 시 fadeUp 모션 — opacity 0→1, translateY 8→0 spring.
 *
 * Reanimated 4 spring으로 마이그레이션 (기존 Animated.timing 280ms 대비
 * 자연스러운 감속곡선). 모든 (tabs) 화면이 이 wrapper를 통해 일관된 진입감.
 *
 * useFocusEffect로 매 포커스마다 리셋·재실행 — tabs 보존(detach) 상황에서도
 * 탭 전환 시 fadeUp이 항상 보이도록.
 */
export function ScreenWrapper({
  children,
  safeArea = true,
  style,
  keyboardAvoiding = false,
  entrance = 'fadeUp',
}: Props) {
  const slide = entrance === 'slide';
  const animate = entrance === 'fadeUp' || slide;
  const start = slide ? 28 : 8; // slide=가로 28px, fadeUp=세로 8px
  const opacity = useSharedValue(animate ? 0 : 1);
  const offset = useSharedValue(animate ? start : 0);

  useFocusEffect(
    useCallback(() => {
      if (!animate) return;
      opacity.value = 0;
      offset.value = start;
      opacity.value = withSpring(1, motion.spring.standard);
      offset.value = withSpring(0, motion.spring.standard);
    }, [animate, start]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: slide ? [{ translateX: offset.value }] : [{ translateY: offset.value }],
  }));

  const animated = (
    <Animated.View style={[styles.animated, animatedStyle, style]}>
      {children}
    </Animated.View>
  );

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.animated}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {animated}
    </KeyboardAvoidingView>
  ) : (
    animated
  );

  if (safeArea) {
    return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;
  }

  return <View style={styles.safe}>{content}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  animated: {
    flex: 1,
  },
});
