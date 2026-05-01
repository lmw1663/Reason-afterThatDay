import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: 'purple' | 'teal' | 'coral' | 'pink' | 'amber';
}

const colorMap = {
  purple: { bg: 'bg-purple-800', activeBg: 'bg-purple-600', text: 'text-purple-400', activeText: 'text-white' },
  teal:   { bg: 'bg-teal-800',   activeBg: 'bg-teal-600',   text: 'text-teal-400',   activeText: 'text-white' },
  coral:  { bg: 'bg-coral-800',  activeBg: 'bg-coral-600',  text: 'text-coral-400',  activeText: 'text-white' },
  pink:   { bg: 'bg-pink-800',   activeBg: 'bg-pink-600',   text: 'text-pink-400',   activeText: 'text-white' },
  amber:  { bg: 'bg-amber-800',  activeBg: 'bg-amber-600',  text: 'text-amber-400',  activeText: 'text-white' },
};

export function Pill({ label, selected = false, onPress, color = 'purple' }: Props) {
  const c = colorMap[color];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={[
        'rounded-full px-4 py-2 mr-2 mb-2',
        selected ? c.activeBg : c.bg,
      ].join(' ')}
    >
      <Text className={['text-sm font-medium', selected ? c.activeText : c.text].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
