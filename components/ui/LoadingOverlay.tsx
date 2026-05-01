import { ActivityIndicator, View, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: Props) {
  if (!visible) return null;
  return (
    <View
      className="items-center justify-center"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998, backgroundColor: colors.overlayBackdropDark }}
    >
      <ActivityIndicator color={colors.purple[400]} size="large" />
      {message && <Text className="text-gray-400 text-sm mt-4">{message}</Text>}
    </View>
  );
}
