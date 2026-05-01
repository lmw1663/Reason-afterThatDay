import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { IconName } from '@/components/ui/Icon';

const RITUAL_OPTIONS: { id: string; label: string; sublabel: string; icon: IconName }[] = [
  { id: 'letter',  label: '편지를 쓸게',       sublabel: '하고 싶었던 말을 글로 남길게',        icon: 'pen'       },
  { id: 'memory',  label: '추억을 정리할게',    sublabel: '소중한 기억을 마음속에 간직할게',      icon: 'book'      },
  { id: 'release', label: '그냥 놓아줄게',      sublabel: '집착 없이 자연스럽게 흘려보낼게',     icon: 'feather'   },
  { id: 'time',    label: '시간에 맡길게',      sublabel: '서두르지 않고 천천히 정리될 것을 믿어', icon: 'hourglass' },
];

const RITUAL_NEXT: Record<string, string> = {
  letter:  '이제 편지처럼 마음을 담아 기억을 가져가.',
  memory:  '그 기억들이 너를 만든 일부야. 언제든 떠올려도 괜찮아.',
  release: '놓아준다는 건 잊는 게 아니야. 더 가볍게 가는 거야.',
  time:    '시간이 흐르면서 자연스럽게 자리를 잡을 거야.',
};

export default function GraduationRitualScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    router.push('/graduation/request');
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">졸업 · 4 / 5</Caption>
        <Heading className="mb-2">이 기억을 어떻게 간직할래?</Heading>
        <Body className="text-gray-400 mb-8">
          졸업은 끝이 아니야. 이 관계를 어떤 방식으로 기억할지 선택해줘.
        </Body>

        <View className="gap-1 mb-8">
          {RITUAL_OPTIONS.map((opt) => (
            <ChoiceButton
              key={opt.id}
              label={opt.label}
              sublabel={opt.sublabel}
              icon={opt.icon}
              selected={selected === opt.id}
              onPress={() => setSelected(opt.id)}
            />
          ))}
        </View>

        {selected && (
          <Card variant="subtle" accent="purple" className="mb-4">
            <Caption className="text-purple-400 leading-relaxed">
              {RITUAL_NEXT[selected]}
            </Caption>
          </Card>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="졸업 신청으로"
          onPress={handleNext}
          disabled={!selected}
        />
        <PrimaryButton
          label="아직 아니야, 돌아갈게"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </ScreenWrapper>
  );
}
