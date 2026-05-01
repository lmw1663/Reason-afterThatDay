import { useState } from 'react';
import { Text, View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { upsertQuestionResponse } from '@/api/questions';

const REGRET_QUESTIONS = [
  { id: 'g_regret_best',   text: '이 관계에서 제일 아쉬웠던 기억이 뭐야?' },
  { id: 'g_regret_unsaid', text: '아직 전하지 못한 말이 있어?' },
];

const READY_QUESTION = { id: 'g_ready', text: '지금 이 선택이 두려움이 아닌 성장에서 온 것 같아?' };

export default function GraduationConfirmScreen() {
  const { userId } = useUserStore();
  const [regretAnswers, setRegretAnswers] = useState<Record<string, string>>({});
  const [readyAnswer, setReadyAnswer] = useState<'yes' | 'no' | null>(null);

  const allRegretFilled = REGRET_QUESTIONS.every((q) => (regretAnswers[q.id] ?? '').trim().length > 0);
  const canProceed = allRegretFilled && readyAnswer !== null;

  function handleNext() {
    if (!canProceed) return;
    if (userId) {
      for (const q of REGRET_QUESTIONS) {
        upsertQuestionResponse({
          userId,
          questionId: q.id,
          responseType: 'text',
          responseValue: regretAnswers[q.id] ?? '',
        }).catch(() => {/* 무시 */});
      }
    }
    router.push('/graduation/ritual' as Href);
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-6 pt-14"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Caption className="mb-2">졸업 · 3 / 5</Caption>
          <Heading className="mb-2">마지막으로 돌아볼게</Heading>
          <Body className="text-gray-400 mb-8">
            솔직하게 털어놓고 가면 더 홀가분할 거야.
          </Body>

          {REGRET_QUESTIONS.map((q) => (
            <View key={q.id} className="mb-8">
              <Body className="text-white font-medium mb-3">{q.text}</Body>
              <TextInput
                value={regretAnswers[q.id] ?? ''}
                onChangeText={(t) => setRegretAnswers((prev) => ({ ...prev, [q.id]: t }))}
                placeholder="솔직하게 적어봐..."
                placeholderTextColor={colors.gray[600]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-white text-base px-4 py-3 rounded-xl bg-surface"
                style={{ minHeight: 80 }}
              />
            </View>
          ))}

          {allRegretFilled && (
            <View className="mb-6">
              <Body className="text-white font-medium mb-3">{READY_QUESTION.text}</Body>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {(['yes', 'no'] as const).map((val) => (
                  <View key={val} style={{ flex: 1 }}>
                    <ChoiceButton
                      label={val === 'yes' ? '그래' : '아직 아니야'}
                      selected={readyAnswer === val}
                      onPress={() => setReadyAnswer(val)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {readyAnswer === 'no' && (
            <Card variant="subtle" accent="amber" className="mb-4">
              <Caption className="text-amber-400 leading-relaxed">
                아직 준비가 완전히 된 건 아닌 것 같아. 조금 더 시간을 갖는 것도 좋아. 돌아가도 괜찮아.
              </Caption>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="다음 — 기억 방식 선택"
          onPress={handleNext}
          disabled={!canProceed}
        />
        <PrimaryButton
          label="아직 아니야, 돌아갈게"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}
