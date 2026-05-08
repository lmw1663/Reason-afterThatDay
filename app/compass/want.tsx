import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { AffectionSlider } from '@/components/ui/AffectionSlider';
import { PreviousAnswerHint } from '@/components/ui/PreviousAnswerHint';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import type { Direction } from '@/store/useJournalStore';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useUserStore } from '@/store/useUserStore';
import { useQuestionStore } from '@/store/useQuestionStore';
import { upsertQuestionResponse } from '@/api/questions';

// c_honest_want 의 응답 표기 — PreviousAnswerHint 가 "저번엔 [잡고 싶어]였는데, 지금은?"
// 형태로 노출. 시간차 후속(c_honest_want→c_check_fear/24h) 발화 anchor 도 됨.
const DIRECTION_LABEL: Record<Direction, string> = {
  catch: '잡고 싶어',
  let_go: '보내고 싶어',
  undecided: '모르겠어',
};

export default function CompassWantScreen() {
  const [selected, setSelected] = useState<Direction | null>(null);
  const [affectionLevel, setAffectionLevel] = useState(5);
  const { history } = useDecisionStore();
  const { userId } = useUserStore();
  const markAnswered = useQuestionStore((s) => s.markAnswered);
  const prevDirection = history[0]?.direction ?? null;

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

        <View className="mt-10">
          <Body className="text-gray-300 mb-4">지금 상대를 어떻게 느껴?</Body>
          <AffectionSlider value={affectionLevel} onChange={setAffectionLevel} />
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={5} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!selected} />
      </View>
    </ScreenWrapper>
  );
}
