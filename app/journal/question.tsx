import { useState } from 'react';
import { Pressable, View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Caption, Heading } from '@/components/ui/Typography';
import { useSmartQuestion } from '@/hooks/useSmartQuestion';
import { useQuestionStore } from '@/store/useQuestionStore';
import type { Direction } from '@/store/useJournalStore';
import { colors } from '@/constants/colors';

export default function JournalQuestionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    physicalSignals: string;
    affectionLevel: string;
    freeText: string;
    direction: string;
  }>();
  const [answer, setAnswer] = useState('');
  const { markAnswered } = useQuestionStore();

  const direction = (params.direction ?? 'undecided') as Direction;
  const smart = useSmartQuestion('journal', direction);
  const question = smart?.question;
  const captionLabel =
    smart?.source === 'direction_change' ? '마음이 바뀐 날 · 3 / 4'
    : smart?.source === 'direction_steady' ? '단단해진 마음 · 3 / 4'
    : smart?.source === 'follow_up'       ? '이어서 물어볼게 · 3 / 4'
    : '이별 일기 · 3 / 4';

  function handleNext() {
    if (question && answer.trim()) {
      markAnswered(question.id, answer.trim());
    }
    router.push({
      pathname: '/journal/response',
      params: { ...params, questionAnswer: answer },
    });
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">{captionLabel}</Caption>

        <Heading className="mb-6 leading-snug">
          {question?.text ?? '오늘 하루 어떤 순간이 기억에 남아?'}
        </Heading>

        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="솔직하게 써봐. 여기선 판단 없어."
          placeholderTextColor={colors.gray[600]}
          multiline
          autoFocus
          accessibilityLabel={question?.text ?? '오늘의 질문 답변'}
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 160 }}
        />
      </View>

      <View className="px-6 pb-10 gap-2">
        <ProgressDots total={4} current={2} />
        <PrimaryButton label="다음" onPress={handleNext} />
        {/* G-11: "건너뛸게"는 보조 행동이라 PrimaryButton ghost(시각 무게 동등)에서
            텍스트 링크로 격하. 단일 primary CTA 원칙 준수. */}
        <Pressable
          onPress={() =>
            router.push({ pathname: '/journal/response', params: { ...params, questionAnswer: '' } })
          }
          accessibilityRole="button"
          accessibilityLabel="건너뛸게"
          hitSlop={8}
          className="active:opacity-60"
        >
          <Caption className="text-center text-gray-500 py-3">건너뛸게 →</Caption>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
