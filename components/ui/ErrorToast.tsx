import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function ErrorToast({ message, visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity, position: 'absolute', bottom: 100, left: 24, right: 24, zIndex: 999 }}
    >
      <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#712B13' }}>
        <Text className="text-white text-sm text-center">{message}</Text>
      </View>
    </Animated.View>
  );
}
