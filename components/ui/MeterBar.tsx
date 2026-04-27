import { Text, View } from 'react-native';

interface Props {
  label: string;
  value: number; // 0~1
  color?: 'purple' | 'teal' | 'coral';
  showDisclaimer?: boolean;
}

const colorMap = {
  purple: { fill: '#7F77DD', bg: '#3C3489' },
  teal:   { fill: '#1D9E75', bg: '#085041' },
  coral:  { fill: '#D85A30', bg: '#712B13' },
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
        <Text className="text-gray-600 text-xs mt-2">
          이건 정답이 아니야. 지금 이 순간의 경향일 뿐이야.
        </Text>
      )}
    </View>
  );
}
