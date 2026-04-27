import { View } from 'react-native';

interface Props {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: Props) {
  return (
    <View className="flex-row gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            backgroundColor: i === current ? '#7F77DD' : '#3C3489',
          }}
        />
      ))}
    </View>
  );
}
