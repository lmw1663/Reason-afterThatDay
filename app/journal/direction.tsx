import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { IconName } from '@/components/ui/Icon';
import { useJournalStore, type Direction } from '@/store/useJournalStore';

const DIRECTIONS: { value: Direction; label: string; sublabel: string; icon: IconName }[] = [
  { value: 'catch',    label: '잡고 싶어',    sublabel: '다시 함께하고 싶은 마음이 있어',  icon: 'heart' },
  { value: 'let_go',   label: '보내고 싶어',  sublabel: '이제 내 길을 가고 싶어',           icon: 'feather' },
  { value: 'undecided',label: '아직 모르겠어', sublabel: '어느 쪽인지 잘 모르겠어',          icon: 'fog' },
];

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

        <ChangeIndicator prev={lastDirection} current={lastDirection ?? 'undecided'} />

        <View className="gap-1">
          {DIRECTIONS.map((d) => (
            <ChoiceButton
              key={d.value}
              label={d.label}
              sublabel={d.sublabel}
              icon={d.icon}
              onPress={() => handleSelect(d.value)}
            />
          ))}
        </View>
      </View>

      <View className="px-6 pb-10">
        <ProgressDots total={4} current={1} />
      </View>
    </ScreenWrapper>
  );
}
