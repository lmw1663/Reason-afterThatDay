import { useState } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { PreviousAnswerHint } from '@/components/ui/PreviousAnswerHint';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { Direction } from '@/store/useJournalStore';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useUserStore } from '@/store/useUserStore';
import { useQuestionStore } from '@/store/useQuestionStore';
import { upsertQuestionResponse } from '@/api/questions';
import { colors } from '@/constants/colors';

// c_honest_want 의 응답 표기 — PreviousAnswerHint 가 "저번엔 [잡고 싶어]였는데, 지금은?"
// 형태로 노출. 시간차 후속(c_honest_want→c_check_fear/24h) 발화 anchor 도 됨.
const DIRECTION_LABEL: Record<Direction, string> = {
  catch: '잡고 싶어',
  let_go: '보내고 싶어',
  undecided: '모르겠어',
};

const AFFECTION_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 4가지 상태 분류 (psychology-analysis.md §3) — G-14 일관성 위해 임상 어휘 제거.
// label은 사용자 친화적 묘사 유지, meaning은 평이한 안내로. journal/direction.tsx와
// 동일한 톤으로 자매 화면 일관성 확보.
function classifyClinicalState(
  direction: Direction | null,
  affectionLevel: number,
): { label: string; meaning: string } | null {
  if (!direction) return null;
  if (direction === 'catch' && affectionLevel >= 7) {
    return { label: '잡고 싶고 좋아하는 마음', meaning: '천천히 들여다봐도 돼' };
  }
  if (direction === 'catch' && affectionLevel <= 3) {
    return { label: '잡고 싶지만 미운 마음', meaning: '가장 흔들리기 쉬운 시점이야' };
  }
  if (direction === 'let_go' && affectionLevel >= 7) {
    return { label: '보내지만 여전히 좋아하는 마음', meaning: '천천히 가는 결이야' };
  }
  if (direction === 'let_go' && affectionLevel <= 3) {
    return { label: '보내고 미움도 큰 마음', meaning: '지금은 자연스러운 흐름이야' };
  }
  return null;
}

export default function CompassWantScreen() {
  const [selected, setSelected] = useState<Direction | null>(null);
  const [affectionLevel, setAffectionLevel] = useState(5);
  const { history } = useDecisionStore();
  const { userId } = useUserStore();
  const markAnswered = useQuestionStore((s) => s.markAnswered);
  const prevDirection = history[0]?.direction ?? null;

  const clinicalState = classifyClinicalState(selected, affectionLevel);

  function handleNext() {
    if (!selected) return;
    // Phase H — c_honest_want 응답 기록. PreviousAnswerHint·시간차 후속(c_check_fear)
    // 발화 anchor. store(낙관적 갱신) + 서버(history archive 트리거) 양쪽.
    const label = DIRECTION_LABEL[selected];
    markAnswered('c_honest_want', label);
    if (userId) {
      upsertQuestionResponse({
        userId,
        questionId: 'c_honest_want',
        responseType: 'direction',
        responseValue: label,
      }).catch(() => {/* 무시 — 다음 진입 시 재시도 */});
    }
    router.push({
      pathname: '/compass/check',
      params: { want: selected, affectionLevel: String(affectionLevel) },
    });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <BackHeader />
        <Caption className="mb-2">결정 나침반 · 1 / 5</Caption>
        <Heading className="mb-2">솔직하게, 지금 뭘 원해?</Heading>
        <Body className="text-gray-400 mb-3">
          맞고 틀린 대답은 없어. 지금 이 순간 느낌 그대로.
        </Body>
        <PreviousAnswerHint questionId="c_honest_want" className="mb-3" />

        <DirectionPicker
          value={selected}
          onChange={setSelected}
          prevDirection={prevDirection}
          changePrefix="저번엔"
          changeSuffix="지금은?"
        />

        {/* 수평축: 애정↔원망 슬라이더 */}
        <View className="mt-10">
          <Body className="text-gray-300 mb-1">지금 상대를 어떻게 느껴?</Body>
          <Caption className="text-gray-500 mb-4">
            마음의 두 축으로 너의 상태를 더 정확히 봐줄게
          </Caption>

          <View className="flex-row justify-between mb-2">
            <Caption className="text-coral-400">완전히 미워</Caption>
            <Caption className="text-purple-400">여전히 좋아</Caption>
          </View>

          <View className="flex-row justify-between items-end">
            {AFFECTION_STEPS.map((step) => (
              <Pressable
                key={step}
                onPress={() => setAffectionLevel(step)}
                accessibilityRole="adjustable"
                accessibilityLabel={`애정 수준 ${step}점`}
                accessibilityState={{ selected: step === affectionLevel }}
                style={{ alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 20,
                    height: step === affectionLevel ? 48 : 28,
                    borderRadius: 4,
                    backgroundColor:
                      step <= affectionLevel
                        ? step <= 3
                          ? colors.coral[400]
                          : step >= 7
                          ? colors.purple[400]
                          : colors.gray[600]
                        : colors.border,
                  }}
                />
                <Text className="text-gray-600 text-xs mt-1">{step}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4가지 임상 상태 분류 결과 */}
        {clinicalState ? (
          <View
            className="mt-6 rounded-2xl p-4"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.purple[600],
            }}
          >
            <Caption className="text-purple-400 mb-1">지금 너의 마음:</Caption>
            <Body className="text-white font-semibold mb-1">{clinicalState.label}</Body>
            <Caption className="text-gray-400">{clinicalState.meaning}</Caption>
          </View>
        ) : (
          selected && (
            <Caption className="mt-4 text-gray-400 text-center">
              지금 이 마음도 자연스러운 거야.
            </Caption>
          )
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={5} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!selected} />
      </View>
    </ScreenWrapper>
  );
}
