import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { AffectionSlider } from '@/components/ui/AffectionSlider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useJournalStore, type Direction } from '@/store/useJournalStore';

export default function JournalDirectionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    physicalSignals: string;
    freeText: string;
  }>();
  const { entries } = useJournalStore();
  const lastDirection = entries[0]?.direction ?? null;

  const [direction, setDirection] = useState<Direction | null>(null);
  const [affectionLevel, setAffectionLevel] = useState(5);

  function handleNext() {
    if (!direction) return;
    router.push({
      pathname: '/journal/question',
      params: { ...params, direction, affectionLevel: String(affectionLevel) },
    });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <BackHeader />
        <Caption className="mb-2">이별 일기 · 2 / 4</Caption>
        <Heading className="mb-2">지금 마음은 어느 쪽이야?</Heading>
        <Body className="text-gray-400 mb-6">
          지금 이 순간의 느낌 그대로 선택해봐.
        </Body>

        <DirectionPicker
          value={direction}
          onChange={setDirection}
          prevDirection={lastDirection}
        />

        <View className="mt-10">
          <Body className="text-gray-300 mb-4">지금 상대를 어떻게 느껴?</Body>
          <AffectionSlider value={affectionLevel} onChange={setAffectionLevel} />
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!direction} />
      </View>
    </ScreenWrapper>
  );
}
