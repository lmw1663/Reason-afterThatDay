import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useJournalStore, type Direction } from '@/store/useJournalStore';

export default function JournalDirectionScreen() {
  const params = useLocalSearchParams<{ score: string; tags: string; freeText: string }>();
  const { entries } = useJournalStore();
  const lastDirection = entries[0]?.direction ?? null;

  function handleSelect(direction: Direction) {
    router.push({
      pathname: '/journal/question',
      params: { ...params, direction },
    });
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">이별 일기 · 2 / 4</Caption>
        <Heading className="mb-2">지금 마음은 어느 쪽이야?</Heading>
        <Body className="text-gray-400 mb-6">
          지금 이 순간의 느낌 그대로 선택해봐.
        </Body>

        <DirectionPicker
          value={null}
          onChange={handleSelect}
          prevDirection={lastDirection}
        />
      </View>

      <View className="px-6 pb-10">
        <ProgressDots total={4} current={1} />
      </View>
    </ScreenWrapper>
  );
}
