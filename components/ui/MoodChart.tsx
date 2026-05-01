import { Dimensions, View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '@/constants/colors';

interface Props {
  moodScores: number[]; // 최신순, 최대 7개
  label?: string;
}

const { width } = Dimensions.get('window');

export function MoodChart({ moodScores, label }: Props) {
  const scores = [...moodScores].reverse(); // 오래된 순으로 표시
  if (scores.length < 2) {
    return (
      <View className="items-center py-6">
        <Text className="text-gray-600 text-sm">일기가 2개 이상 있어야 차트를 볼 수 있어.</Text>
      </View>
    );
  }

  const labels = scores.map((_, i) =>
    i === 0 ? `D-${scores.length - 1}` : i === scores.length - 1 ? '오늘' : '',
  );

  return (
    <View>
      {label && <Text className="text-gray-400 text-xs mb-2">{label}</Text>}
      <LineChart
        data={{ labels, datasets: [{ data: scores }] }}
        width={width - 48}
        height={160}
        yAxisSuffix="°"
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(29, 158, 117, ${opacity})`,
          labelColor: () => colors.gray[400],
          propsForDots: { r: '4', strokeWidth: '2', stroke: colors.teal[400] },
        }}
        bezier
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}
