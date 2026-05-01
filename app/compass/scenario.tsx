import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';

const SCENARIOS = [
  {
    id: 's1',
    text: '다시 연락이 온다면?',
    catchScore: 2, letGoScore: -2,
    options: [{ label: '설레고 만나고 싶어', value: 'catch' }, { label: '부담스럽거나 두려워', value: 'letgo' }, { label: '잘 모르겠어', value: 'neutral' }],
  },
  {
    id: 's2',
    text: '상대방이 다른 사람을 만난다면?',
    catchScore: 2, letGoScore: -2,
    options: [{ label: '많이 힘들 것 같아', value: 'catch' }, { label: '잘됐으면 좋겠어', value: 'letgo' }, { label: '복잡해', value: 'neutral' }],
  },
  {
    id: 's3',
    text: '1년 뒤 혼자라면?',
    catchScore: -1, letGoScore: 1,
    options: [{ label: '성장해 있을 것 같아', value: 'letgo' }, { label: '외롭고 후회할 것 같아', value: 'catch' }, { label: '예측하기 어려워', value: 'neutral' }],
  },
];

export default function CompassScenarioScreen() {
  const params = useLocalSearchParams<{ want: string; score: string }>();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function calcFinalScore(): number {
    let score = Number(params.score ?? '0');
    for (const sc of SCENARIOS) {
      const a = answers[sc.id];
      if (a === 'catch')  score += sc.catchScore;
      if (a === 'letgo')  score += sc.letGoScore;
      // neutral → 0
    }
    return score;
  }

  function handleNext() {
    const finalScore = calcFinalScore();
    router.push({ pathname: '/compass/needle', params: { ...params, finalScore: String(finalScore) } });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />
        <Caption className="mb-2">결정 나침반 · 3 / 5</Caption>
        <Heading className="mb-2">시나리오로 탐색해볼게</Heading>
        <Body className="text-gray-400 mb-8">
          각 상황에서 떠오르는 첫 느낌으로 골라봐.
        </Body>

        {SCENARIOS.map((sc) => (
          <View key={sc.id} className="mb-8">
            <Text className="text-white text-base font-semibold mb-3">{sc.text}</Text>
            <View className="gap-2">
              {sc.options.map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  label={opt.label}
                  selected={answers[sc.id] === opt.value}
                  onPress={() => setAnswers((prev) => ({ ...prev, [sc.id]: opt.value }))}
                />
              ))}
            </View>
          </View>
        ))}

        <ProgressDots total={5} current={2} />
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="나침반 보기"
          onPress={handleNext}
          disabled={SCENARIOS.some((s) => !answers[s.id])}
        />
      </View>
    </ScreenWrapper>
  );
}
