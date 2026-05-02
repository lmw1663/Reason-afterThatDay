import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { upsertQuestionResponse } from '@/api/questions';

// ID는 question_pool의 compass 체크 질문과 1:1 매핑 (migration 005)
const CHECK_QUESTIONS = [
  { id: 'c_check_past',   text: '6개월 전으로 돌아가도 같은 선택을 할 것 같아?',    catchScore: -1, letGoScore: 1  },
  { id: 'c_check_change', text: '상대방이 바뀔 수 있다고 진심으로 믿어?',           catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_harder', text: '혼자인 지금이 같이였을 때보다 더 힘들어?',         catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_free',   text: '상대 없이 내 삶을 상상하면 자유롭다는 느낌이 들어?', catchScore: -2, letGoScore: 2  },
  { id: 'c_check_fear',   text: '지금 이 결정이 두려움에서 온 게 아니라고 할 수 있어?', catchScore: 1, letGoScore: 1  },
];

export default function CompassCheckScreen() {
  const params = useLocalSearchParams<{ want: string; affectionLevel: string }>();
  const { userId } = useUserStore();
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});

  const allAnswered = CHECK_QUESTIONS.every((q) => answers[q.id]);

  function calcScore(): number {
    let score = 0;
    for (const q of CHECK_QUESTIONS) {
      if (answers[q.id] === 'yes') score += q.catchScore;
      else if (answers[q.id] === 'no') score += q.letGoScore * -1;
    }
    if (params.want === 'catch')   score += 2;
    if (params.want === 'let_go')  score -= 2;
    return score;
  }

  function handleNext() {
    const score = calcScore();
    // 답변을 질문 풀에 저장 — cross-track 연계
    if (userId) {
      for (const q of CHECK_QUESTIONS) {
        const val = answers[q.id];
        if (val) {
          upsertQuestionResponse({
            userId,
            questionId: q.id,
            responseType: 'boolean',
            responseValue: val === 'yes',
          }).catch(() => {/* 무시 */});
        }
      }
    }
    router.push({
      pathname: '/compass/scenario',
      params: {
        want: params.want,
        score: String(score),
        affectionLevel: params.affectionLevel ?? '5',
      },
    });
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
