import { View } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: Props) {
  return (
    <View
      className="flex-row gap-1.5 justify-center"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
      accessibilityLabel={`총 ${total}단계 중 ${current + 1}단계`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            backgroundColor: i === current ? colors.purple[400] : colors.purple[800],
          }}
        />
      ))}
    </View>
  );
}
