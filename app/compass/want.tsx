import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { Direction } from '@/store/useJournalStore';
import { useDecisionStore } from '@/store/useDecisionStore';

export default function CompassWantScreen() {
  const [selected, setSelected] = useState<Direction | null>(null);
  const { history } = useDecisionStore();
  const prevDirection = history[0]?.direction ?? null;

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: '/compass/check', params: { want: selected } });
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">결정 나침반 · 1 / 5</Caption>
        <Heading className="mb-2">솔직하게, 지금 뭘 원해?</Heading>
        <Body className="text-gray-400 mb-6">
          맞고 틀린 대답은 없어. 지금 이 순간 느낌 그대로.
        </Body>

        <DirectionPicker
          value={selected}
          onChange={setSelected}
          prevDirection={prevDirection}
          changePrefix="저번엔"
          changeSuffix="지금은?"
        />
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={5} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!selected} />
      </View>
    </ScreenWrapper>
  );
}
