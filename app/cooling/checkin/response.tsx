import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { Body, Caption, Heading } from '@/components/ui/Typography';

export default function CheckinResponseScreen() {
  const { response, day } = useLocalSearchParams<{ response: string; day: string }>();

  const aiResponse = response ?? '오늘 체크인 잘했어. 이 마음 기억해줘.';
  const dayNum = Number(day ?? 1);

  const dayLabel: Record<number, string> = {
    1: '첫 하루를 잘 버텼어',
    2: '흔들려도 괜찮아',
    3: '분노도 정상이야',
    4: '슬픔이 깊어지는 중',
    5: '의미를 찾아가는 중',
    6: '미래를 그리고 있어',
    7: '7일을 견뎌낸 너에게',
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">자율 체크인 · Day {dayNum}</Caption>
        <Heading className="mb-8">{dayLabel[dayNum] ?? '체크인 완료'}</Heading>

        <InsightCard
          tag="오늘의 한마디"
          body={aiResponse}
          accent="purple"
        />

        <Body className="text-gray-500 text-center mt-8 text-sm">
          기록됐어. 고마워.
        </Body>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="다시 입력할게"
          variant="ghost"
          onPress={() => router.back()}
        />
        <PrimaryButton
          label="홈으로"
          onPress={() => router.replace('/cooling' as never)}
        />
      </View>
    </ScreenWrapper>
  );
}
