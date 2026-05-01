import { Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { disclaimer } from '@/constants/copy';
import { Caption } from './Typography';

interface Props {
  label: string;
  value: number; // 0~1
  color?: 'purple' | 'teal' | 'coral';
  showDisclaimer?: boolean;
}

const colorMap = {
  purple: { fill: colors.purple[400], bg: colors.purple[800] },
  teal:   { fill: colors.teal[400], bg: colors.teal[800] },
  coral:  { fill: colors.coral[400], bg: colors.coral[800] },
};

export function MeterBar({ label, value, color = 'purple', showDisclaimer }: Props) {
  const c = colorMap[color];
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <View className="mb-5">
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-400 text-sm">{label}</Text>
        <Text className="text-gray-600 text-sm">
          {pct < 33 ? '낮음' : pct < 66 ? '중간' : '높음'}
        </Text>
      </View>
      <View
        className="rounded-full h-3 w-full overflow-hidden"
        style={{ backgroundColor: c.bg }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: c.fill }}
        />
      </View>
      {showDisclaimer && (
        <Caption variant="subtle" className="mt-2">
          {disclaimer.meterReference}
        </Caption>
      )}
    </View>
  );
}
