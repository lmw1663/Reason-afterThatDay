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
   * 진입 모션. 기본 'fadeUp'(opacity + translateY spring).
   * 'none' — 화면 전환을 네비게이터가 담당할 때(예: 탭의 'shift' 가로 슬라이드)
   *          세로 fadeUp과 이중으로 겹치지 않도록 끈다.
   */
  entrance?: 'fadeUp' | 'none';
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
  const animate = entrance === 'fadeUp';
  const opacity = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 8 : 0);

  useFocusEffect(
    useCallback(() => {
      if (!animate) return;
      opacity.value = 0;
      translateY.value = 8;
      opacity.value = withSpring(1, motion.spring.standard);
      translateY.value = withSpring(0, motion.spring.standard);
    }, [animate]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
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
