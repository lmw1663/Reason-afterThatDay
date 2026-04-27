import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  safeArea?: boolean;
  style?: object;
}

export function ScreenWrapper({ children, safeArea = true, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const content = (
    <Animated.View
      style={[styles.animated, { opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={styles.safe}>
        {content}
      </SafeAreaView>
    );
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
