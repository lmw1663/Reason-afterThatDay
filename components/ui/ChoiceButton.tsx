import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: string;
}

export function ChoiceButton({ label, sublabel, selected = false, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'rounded-2xl p-4 mb-3 border',
        selected
          ? 'bg-purple-800/40 border-purple-600'
          : 'border-gray-800 active:border-gray-600',
      ].join(' ')}
      style={{ backgroundColor: selected ? 'rgba(83,74,183,0.15)' : '#1A1A22' }}
    >
      <View className="flex-row items-center gap-3">
        {icon && <Text className="text-2xl">{icon}</Text>}
        <View className="flex-1">
          <Text
            className={[
              'text-base font-semibold',
              selected ? 'text-purple-400' : 'text-white',
            ].join(' ')}
          >
            {label}
          </Text>
          {sublabel && (
            <Text className="text-gray-400 text-sm mt-0.5">{sublabel}</Text>
          )}
        </View>
        {selected && (
          <View className="w-5 h-5 rounded-full bg-purple-600 items-center justify-center">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
