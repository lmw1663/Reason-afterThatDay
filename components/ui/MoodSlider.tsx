import { Text, View, Pressable } from 'react-native';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: '완전 최악', 2: '많이 힘들어', 3: '힘들어',
  4: '좀 힘들어', 5: '그냥 그래',
  6: '그나마 괜찮아', 7: '꽤 괜찮아',
  8: '좋아', 9: '많이 좋아', 10: '최고야',
};

const SCORE_COLOR: Record<number, string> = {
  1: '#D85A30', 2: '#D85A30', 3: '#D85A30',
  4: '#BA7517', 5: '#888780',
  6: '#1D9E75', 7: '#1D9E75',
  8: '#7F77DD', 9: '#7F77DD', 10: '#7F77DD',
};

export function MoodSlider({ value, onChange }: Props) {
  return (
    <View>
      <View className="flex-row justify-between items-end mb-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
          <Pressable
            key={score}
            onPress={() => onChange(score)}
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                width: 24,
                height: score === value ? 56 : 32,
                backgroundColor:
                  score <= value ? SCORE_COLOR[value] : '#2C2C38',
                borderRadius: 4,
              }}
            />
            <Text className="text-gray-600 text-xs mt-1">{score}</Text>
          </Pressable>
        ))}
      </View>
      <Text
        className="text-center text-base font-semibold mt-2"
        style={{ color: SCORE_COLOR[value] }}
      >
        {SCORE_LABELS[value]}
      </Text>
    </View>
  );
}
