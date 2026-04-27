import { ActivityIndicator, View, Text } from 'react-native';

interface Props {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: Props) {
  if (!visible) return null;
  return (
    <View
      className="items-center justify-center"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998, backgroundColor: 'rgba(14,14,18,0.85)' }}
    >
      <ActivityIndicator color="#7F77DD" size="large" />
      {message && <Text className="text-gray-400 text-sm mt-4">{message}</Text>}
    </View>
  );
}
