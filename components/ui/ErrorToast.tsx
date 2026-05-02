import { useEffect, useRef, useState } from 'react';
import { colors } from '@/constants/colors';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
  action?: {
    label: string;
    onPress: () => Promise<void>;
  };
}

export function ErrorToast({ message, visible, onHide, action }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const duration = action ? 5000 : 2800;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible, message]);

  async function handleRetry() {
    if (!action) return;
    setRetrying(true);
    try {
      await action.onPress();
      onHide();
    } finally {
      setRetrying(false);
    }
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity, position: 'absolute', bottom: 100, left: 24, right: 24, zIndex: 999 }}
    >
      <View
        className="rounded-2xl px-4 py-3 flex-row items-center justify-between"
        style={{ backgroundColor: colors.coral[800] }}
      >
        <Text className="text-white text-sm flex-1 mr-3">{message}</Text>
        {action && (
          <Pressable
            onPress={handleRetry}
            disabled={retrying}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            className="bg-white/20 rounded-xl px-3 py-1.5 active:opacity-70"
          >
            {retrying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-sm font-semibold">{action.label}</Text>
            )}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
