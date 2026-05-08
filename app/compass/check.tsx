import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { PreviousAnswerHint } from '@/components/ui/PreviousAnswerHint';
import { useUserStore } from '@/store/useUserStore';
import { upsertQuestionResponse } from '@/api/questions';
import { useSmartQuestion } from '@/hooks/useSmartQuestion';
import type { Direction } from '@/store/useJournalStore';
import { colors } from '@/constants/colors';

// ID는 question_pool의 compass 체크 질문과 1:1 매핑 (migration 005)
const CHECK_QUESTIONS = [
  { id: 'c_check_past',   text: '6개월 전으로 돌아가도 같은 선택을 할 것 같아?',    catchScore: -1, letGoScore: 1  },
  { id: 'c_check_change', text: '상대방이 바뀔 수 있다고 진심으로 믿어?',           catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_harder', text: '혼자인 지금이 같이였을 때보다 더 힘들어?',         catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_free',   text: '상대 없이 내 삶을 상상하면 자유롭다는 느낌이 들어?', catchScore: -2, letGoScore: 2  },
  { id: 'c_check_fear',   text: '지금 이 결정이 두려움에서 온 게 아니라고 할 수 있어?', catchScore: 1, letGoScore: 1  },
];
const CHECK_IDS = new Set(CHECK_QUESTIONS.map((q) => q.id));

// Phase H+1 — useSmartQuestion 결과로 follow_up/revisit 매칭 시 해당 질문에 강조 캡션.
// 5개 fixed 점수 산정 알고리즘은 그대로 유지(나침반 정확도 보존). 동적 노출의 효과는
// "*어떤 질문이 지금 특별히 의미 있는가*" 신호를 시각적으로 더하는 것.
//
// follow_up : 부모 답이 변경됐거나 시간차 후속 트리거됨 — "이어서 물어볼게"
// revisit   : D+N 시간차 자기참조 — "다시 떠올려볼게"
function highlightCaption(source: 'follow_up' | 'revisit'): string {
  return source === 'follow_up' ? '이어서 물어볼게' : '다시 떠올려볼게';
}

export default function CompassCheckScreen() {
  const params = useLocalSearchParams<{ want: string; affectionLevel: string }>();
  const { userId } = useUserStore();
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});

  // Phase H+1 — params.want 를 Direction 으로 캐스팅. 비정상 입력은 'undecided' 폴백.
  const want: Direction =
    params.want === 'catch' || params.want === 'let_go' ? params.want : 'undecided';
  const smart = useSmartQuestion('compass', want);

  // 5개 중 하나가 follow_up/revisit 으로 지목됐으면 그 ID 만 강조.
  // highlightSource 를 좁힌 union 으로 명시 — highlightedId 가 set 이면 같이 set.
  const highlightSource: 'follow_up' | 'revisit' | null =
    smart && (smart.source === 'follow_up' || smart.source === 'revisit') ? smart.source : null;
  const highlightedId =
    highlightSource && smart && CHECK_IDS.has(smart.question.id) ? smart.question.id : null;

  const allAnswered = CHECK_QUESTIONS.every((q) => answers[q.id]);

  function calcScore(): number {
    let score = 0;
    for (const q of CHECK_QUESTIONS) {
      if (answers[q.id] === 'yes') score += q.catchScore;
      else if (answers[q.id] === 'no') score += q.letGoScore * -1;
    }
    if (want === 'catch')  score += 2;
    if (want === 'let_go') score -= 2;
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
        want, // 캐스팅된 Direction 만 전달 — deeplink 비정상 입력에도 안전
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

        {CHECK_QUESTIONS.map((q) => {
          const isHighlighted = q.id === highlightedId;
          return (
            <View
              key={q.id}
              className="mb-6"
              style={
                isHighlighted
                  ? {
                      paddingLeft: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.purple[400],
                    }
                  : undefined
              }
            >
              {isHighlighted && highlightSource && (
                <Caption className="text-purple-400 mb-1">
                  {highlightCaption(highlightSource)}
                </Caption>
              )}
              <Text className="text-white text-base font-medium mb-3">{q.text}</Text>
              <PreviousAnswerHint questionId={q.id} />
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
          );
        })}

        <ProgressDots total={5} current={1} />
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="다음" onPress={handleNext} disabled={!allAnswered} />
      </View>
    </ScreenWrapper>
  );
}
