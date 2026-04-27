import { Text, View } from 'react-native';

interface Props {
  current: number;
  total: number;
  label?: string;
}

export function StepLabel({ current, total, label }: Props) {
  return (
    <View className="flex-row items-center gap-2 mb-6">
      <Text className="text-gray-400 text-sm">
        {current} / {total}
      </Text>
      {label && (
        <Text className="text-gray-600 text-sm">{label}</Text>
      )}
    </View>
  );
}
