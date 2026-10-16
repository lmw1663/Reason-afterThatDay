import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import {
  MoodMatrixPicker,
  type MoodMatrixResult,
} from '@/components/ui/MoodMatrixPicker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useJournalStore } from '@/store/useJournalStore';

export default function JournalDirectionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    physicalSignals: string;
    freeText: string;
  }>();
  const { entries } = useJournalStore();
  const lastDirection = entries[0]?.direction ?? null;

  const [pick, setPick] = useState<MoodMatrixResult | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  function handleNext() {
    if (!pick) return;
    router.push({
      pathname: '/journal/question',
      params: {
        ...params,
        direction: pick.direction,
        affectionLevel: String(pick.affectionLevel),
      },
    });
  }

  return (
    <ScreenWrapper>
      <View className="px-6 pt-14">
        <BackHeader />
      </View>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        scrollEnabled={scrollEnabled}
      >
        <Caption className="mb-2">이별 일기 · 2 / 4</Caption>
        <Heading className="mb-2">지금 마음은 어느 쪽이야?</Heading>
        <Body className="text-gray-400 mb-6">
          잡고 싶은지 보내고 싶은지, 그리고 상대가 좋은지 미운지. 지금 느낌 그대로 골라봐.
        </Body>

        <MoodMatrixPicker
          onChange={setPick}
          onActiveChange={(a) => setScrollEnabled(!a)}
          prevDirection={lastDirection}
        />
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!pick} />
      </View>
    </ScreenWrapper>
  );
}
