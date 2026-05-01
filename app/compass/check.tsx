import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';

// 공유 질문 풀에서 compass 맥락 질문을 사용하되, 이성 체크용 간단 예/아니오 형태로 제시
const CHECK_QUESTIONS = [
  { id: 'c1', text: '6개월 전으로 돌아가도 같은 선택을 할 것 같아?',    catchScore: -1, letGoScore: 1  },
  { id: 'c2', text: '상대방이 바뀔 수 있다고 진심으로 믿어?',           catchScore: 2,  letGoScore: -1 },
  { id: 'c3', text: '혼자인 지금이 같이였을 때보다 더 힘들어?',         catchScore: 2,  letGoScore: -1 },
  { id: 'c4', text: '상대 없이 내 삶을 상상하면 자유롭다는 느낌이 들어?', catchScore: -2, letGoScore: 2  },
  { id: 'c5', text: '지금 이 결정이 두려움에서 온 게 아니라고 할 수 있어?', catchScore: 1, letGoScore: 1  },
];

export default function CompassCheckScreen() {
  const params = useLocalSearchParams<{ want: string }>();
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});

  const allAnswered = CHECK_QUESTIONS.every((q) => answers[q.id]);

  function calcScore(): number {
    let score = 0;
    for (const q of CHECK_QUESTIONS) {
      if (answers[q.id] === 'yes') score += q.catchScore;
      else if (answers[q.id] === 'no') score += q.letGoScore * -1;
    }
    // want 가중치 반영
    if (params.want === 'catch')   score += 2;
    if (params.want === 'let_go')  score -= 2;
    return score;
  }

  function handleNext() {
    const score = calcScore();
    router.push({ pathname: '/compass/scenario', params: { want: params.want, score: String(score) } });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />
        <Caption className="mb-2">결정 나침반 · 2 / 5</Caption>
        <Heading className="mb-2">이성적으로 한번 체크해볼게</Heading>
        <Body className="text-gray-400 mb-8">
          직감보다 조금 느리게 생각해봐.
        </Body>

        {CHECK_QUESTIONS.map((q) => (
          <View key={q.id} className="mb-6">
            <Text className="text-white text-base font-medium mb-3">{q.text}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['yes', 'no'] as const).map((val) => (
                <View key={val} style={{ flex: 1 }}>
                  <ChoiceButton
                    label={val === 'yes' ? '그래' : '아니야'}
                    selected={answers[q.id] === val}
                    onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <ProgressDots total={5} current={1} />
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="다음" onPress={handleNext} disabled={!allAnswered} />
      </View>
    </ScreenWrapper>
  );
}
