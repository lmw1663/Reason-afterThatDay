import { Dimensions, View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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
          backgroundColor: '#1A1A22',
          backgroundGradientFrom: '#1A1A22',
          backgroundGradientTo: '#1A1A22',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(29, 158, 117, ${opacity})`,
          labelColor: () => '#888780',
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#1D9E75' },
        }}
        bezier
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}
