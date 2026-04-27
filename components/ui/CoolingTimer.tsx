import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface Props {
  coolingEndsAt: string; // ISO string
}

export function CoolingTimer({ coolingEndsAt }: Props) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    function update() {
      const now = new Date();
      const end = new Date(coolingEndsAt);
      const diffMs = end.getTime() - now.getTime();
      if (diffMs <= 0) { setDaysLeft(0); setHoursLeft(0); return; }
      setDaysLeft(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      setHoursLeft(Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [coolingEndsAt]);

  const isDay7 = daysLeft === 0;

  return (
    <View className="items-center py-6">
      <Text className="text-gray-400 text-sm mb-2">졸업까지</Text>
      {isDay7 ? (
        <Text className="text-teal-400 text-4xl font-bold">오늘이야</Text>
      ) : (
        <Text className="text-white text-5xl font-bold">D-{daysLeft}</Text>
      )}
      <Text className="text-gray-600 text-sm mt-2">
        {isDay7 ? '최종 확인을 눌러봐' : `${hoursLeft}시간 남았어`}
      </Text>
    </View>
  );
}
