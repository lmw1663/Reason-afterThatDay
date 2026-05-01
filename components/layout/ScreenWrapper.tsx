import { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  safeArea?: boolean;
  style?: object;
  /**
   * TextInput이 있는 화면에서 키보드가 입력창을 가리지 않도록 처리.
   * 기본값: false (불필요한 레이아웃 비용 회피)
   */
  keyboardAvoiding?: boolean;
}

export function ScreenWrapper({ children, safeArea = true, style, keyboardAvoiding = false }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const animated = (
    <Animated.View style={[styles.animated, { opacity, transform: [{ translateY }] }, style]}>
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
