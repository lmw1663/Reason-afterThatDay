import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useDecisionStore } from '@/store/useDecisionStore';
import type { Direction } from '@/store/useJournalStore';

const OPTIONS: { value: Direction; label: string; sublabel: string; icon: string }[] = [
  { value: 'catch',     label: '다시 함께하고 싶어',  sublabel: '아직 마음이 남아있어',     icon: '💜' },
  { value: 'let_go',    label: '이제 보내주고 싶어',  sublabel: '내 길을 가고 싶은 마음이야', icon: '🕊️' },
  { value: 'undecided', label: '솔직히 모르겠어',     sublabel: '어느 쪽도 확신이 없어',     icon: '🌫️' },
];

export default function CompassWantScreen() {
  const [selected, setSelected] = useState<Direction | null>(null);

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: '/compass/check', params: { want: selected } });
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">결정 나침반 · 1 / 5</Text>
        <Text className="text-white text-2xl font-bold mb-2">
          솔직하게, 지금 뭘 원해?
        </Text>
        <Text className="text-gray-400 text-sm mb-8">
          맞고 틀린 대답은 없어. 지금 이 순간 느낌 그대로.
        </Text>

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
        <ProgressDots total={5} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!selected} />
      </View>
    </ScreenWrapper>
  );
}
