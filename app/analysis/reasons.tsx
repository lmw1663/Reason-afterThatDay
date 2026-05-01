import { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useSmartQuestion } from '@/hooks/useSmartQuestion';
import { useUserStore } from '@/store/useUserStore';
import { upsertQuestionResponse } from '@/api/questions';
import { colors } from '@/constants/colors';

const REASON_CATEGORIES = [
  { label: '성격 차이', color: 'purple' as const },
  { label: '소통 문제',  color: 'coral'  as const },
  { label: '가치관 차이', color: 'amber'  as const },
  { label: '거리/환경',  color: 'teal'   as const },
  { label: '신뢰 문제',  color: 'pink'   as const },
  { label: '감정 온도차', color: 'purple' as const },
  { label: '미래 방향',  color: 'teal'   as const },
  { label: '외부 압박',  color: 'amber'  as const },
  { label: '자존감 문제', color: 'coral'  as const },
  { label: '잦은 다툼',  color: 'pink'   as const },
  { label: '권태',      color: 'purple' as const },
  { label: '그냥 시간',  color: 'teal'   as const },
];

export default function AnalysisReasonScreen() {
  const { profile, updateField } = useRelationshipStore();
  const { userId } = useUserStore();
  const [selected, setSelected] = useState<string[]>(profile.reasons);
  const [answer, setAnswer] = useState('');

  const poolQuestion = useSmartQuestion('analysis', 'undecided');

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  function handleNext() {
    updateField('reasons', selected);
    if (poolQuestion && answer.trim() && userId) {
      upsertQuestionResponse({
        userId,
        questionId: poolQuestion.id,
        responseType: 'text',
        responseValue: answer.trim(),
      }).catch(() => {/* 저장 실패는 무시 — 다음 세션에서 재시도 */});
    }
    router.push('/analysis/pros-cons');
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">관계 분석 · 1 / 5</Caption>
        <Heading className="mb-2">왜 헤어졌어?</Heading>
        <Body className="text-gray-400 mb-8">
          여러 개 골라도 돼. 복잡한 이유가 있어도 괜찮아.
        </Body>

        <View className="flex-row flex-wrap">
          {REASON_CATEGORIES.map(({ label, color }) => (
            <Pill
              key={label}
              label={label}
              color={color}
              selected={selected.includes(label)}
              onPress={() => toggle(label)}
            />
          ))}
        </View>

        {poolQuestion && selected.length > 0 && (
          <View className="mt-8">
            <Body className="text-white font-medium mb-3">{poolQuestion.text}</Body>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="솔직하게 적어봐..."
              placeholderTextColor={colors.gray[600]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="text-white text-base px-4 py-3 rounded-xl bg-surface"
              style={{ minHeight: 80 }}
            />
          </View>
        )}

        <View className="mt-8 mb-4">
          <ProgressDots total={5} current={0} />
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="다음"
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </ScreenWrapper>
  );
}
