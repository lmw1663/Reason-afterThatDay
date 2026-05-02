import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useUserStore } from '@/store/useUserStore';
import { compassVerdict, VERDICT_LABEL, VERDICT_COLOR } from '@/utils/diagnosis';
import { supabase } from '@/api/supabase';
import type { Direction } from '@/store/useJournalStore';
import { disclaimer } from '@/constants/copy';

export default function CompassNeedleScreen() {
  const params = useLocalSearchParams<{ want: string; finalScore: string }>();
  const { addDecision } = useDecisionStore();
  const { userId, daysElapsed } = useUserStore();
  const [saveError, setSaveError] = useState(false);

  const diff = Number(params.finalScore ?? '0');
  const verdict = compassVerdict(diff);
  const color = VERDICT_COLOR[verdict];
  const label = VERDICT_LABEL[verdict];

  // 나침반 바늘 각도 (-90° ~ +90°)
  const needleAngle = Math.max(-80, Math.min(80, diff * 12));

  useEffect(() => {
    const record = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      direction: (params.want ?? 'undecided') as Direction,
      verdict,
      diffScore: diff,
    };
    addDecision(record);

    if (userId) {
      supabase.from('decision_history').insert({
        user_id: userId,
        direction: record.direction,
        verdict,
        diff_score: diff,
      }).then(({ error }) => {
        if (error) setSaveError(true);
      });
    }
  }, []);

  async function retrySave() {
    if (!userId) return;
    const { error } = await supabase.from('decision_history').insert({
      user_id: userId,
      direction: (params.want ?? 'undecided') as Direction,
      verdict,
      diff_score: diff,
    });
    if (error) throw error;
  }

  return (
    <ScreenWrapper>
      <ErrorToast
        visible={saveError}
        message="나침반 결과 저장이 안 됐어. 다시 시도해볼까?"
        onHide={() => setSaveError(false)}
        action={{ label: '재시도', onPress: retrySave }}
      />
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">결정 나침반 · 4 / 5</Caption>
        <Heading className="mb-8">나침반이야</Heading>

        {/* 나침반 시각화 */}
        <View className="items-center mb-8">
          <View
            className="w-48 h-48 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border }}
          >
            {/* 나침반 바늘 */}
            <View
              className="absolute"
              style={{ transform: [{ rotate: `${needleAngle}deg` }] }}
            >
              <View
                className="rounded-full"
                style={{ width: 4, height: 60, backgroundColor: color, marginBottom: 4 }}
              />
              <View
                className="rounded-full"
                style={{ width: 4, height: 36, backgroundColor: colors.gray[800] }}
              />
            </View>
            <View
              className="absolute w-4 h-4 rounded-full"
              style={{ backgroundColor: colors.border, borderWidth: 2, borderColor: colors.gray[400] }}
            />
          </View>

          <View className="flex-row justify-between w-56 mt-2">
            <Text className="text-purple-400 text-sm font-medium">잡기</Text>
            <Text className="text-teal-400 text-sm font-medium">보내기</Text>
          </View>
        </View>

        {/* 결과 — verdict별 동적 색상이라 인라인 borderLeftColor 유지 */}
        <View
          className="bg-surface rounded-2xl p-5 mb-4"
          style={{ borderLeftWidth: 4, borderLeftColor: color }}
        >
          <Text className="text-base font-semibold mb-2" style={{ color }}>
            {label}
          </Text>
          <Body className="text-gray-400">{getDescription(verdict)}</Body>
        </View>

        {/* 6-7: 시간성 명시 — 고정 마인드셋 방지 */}
        <Card className="mb-4 border border-amber-700/50">
          <Caption className="text-amber-400 mb-1">📅 지금 이 시점의 너야</Caption>
          <Body className="text-gray-300 text-sm">
            이 나침반은 D+{daysElapsed} 시점의 너를 가리키고 있어.{'\n'}한 달 뒤엔 다르게 가리킬 수도 있어.
          </Body>
        </Card>

        {/* 절대 규칙: "정답이 아니야" 문구 필수 */}
        <Card variant="subtle" accent="purple" tone="weak" className="mb-6">
          <Caption className="text-purple-400 text-center">
            {disclaimer.compassResult}
          </Caption>
        </Card>

        <ProgressDots total={5} current={3} />
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="행동 제안 보기"
          onPress={() => router.push({ pathname: '/compass/action', params: { verdict } })}
        />
      </View>
    </ScreenWrapper>
  );
}

function getDescription(verdict: ReturnType<typeof compassVerdict>): string {
  switch (verdict) {
    case 'strong_catch':
      return '잡고 싶은 마음이 꽤 분명해 보여. 이 마음이 어디서 오는지 한번 더 들여다봐도 좋을 것 같아.';
    case 'lean_catch':
      return '잡는 쪽으로 조금 기울어진 것 같아. 아직 확신이 완전하지 않을 수 있어.';
    case 'undecided':
      return '지금은 어느 쪽도 확실하지 않아. 그게 솔직한 마음일 수 있어. 더 시간을 줘도 괜찮아.';
    case 'lean_let_go':
      return '보내는 쪽으로 조금 기울어진 것 같아. 그 마음도 충분히 이해할 수 있어.';
    case 'strong_let_go':
      return '보내고 싶은 마음이 꽤 분명해 보여. 그것도 용기 있는 선택이야.';
  }
}
