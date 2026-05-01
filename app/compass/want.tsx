import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { IconName } from '@/components/ui/Icon';
import type { Direction } from '@/store/useJournalStore';
import { useDecisionStore } from '@/store/useDecisionStore';

const OPTIONS: { value: Direction; label: string; sublabel: string; icon: IconName }[] = [
  { value: 'catch',     label: '다시 함께하고 싶어',  sublabel: '아직 마음이 남아있어',     icon: 'heart' },
  { value: 'let_go',    label: '이제 보내주고 싶어',  sublabel: '내 길을 가고 싶은 마음이야', icon: 'feather' },
  { value: 'undecided', label: '솔직히 모르겠어',     sublabel: '어느 쪽도 확신이 없어',     icon: 'fog' },
];

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

        <ChangeIndicator
          prev={prevDirection}
          current={selected ?? 'undecided'}
          prefix="저번엔"
          suffix="지금은?"
        />

        <View className="gap-1">
          {OPTIONS.map((opt) => (
            <ChoiceButton
              key={opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              icon={opt.icon}
              selected={selected === opt.value}
              onPress={() => setSelected(opt.value)}
            />
          ))}
        </View>
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={5} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!selected} />
      </View>
    </ScreenWrapper>
  );
}
