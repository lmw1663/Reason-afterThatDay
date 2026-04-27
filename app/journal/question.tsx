import { useState } from 'react';
import { Text, View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useSmartQuestion } from '@/hooks/useSmartQuestion';
import { useQuestionStore } from '@/store/useQuestionStore';
import type { Direction } from '@/store/useJournalStore';

export default function JournalQuestionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    freeText: string;
    direction: string;
  }>();
  const [answer, setAnswer] = useState('');
  const { markAnswered } = useQuestionStore();

  const direction = (params.direction ?? 'undecided') as Direction;
  const question = useSmartQuestion('journal', direction);

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
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">이별 일기 · 3 / 4</Text>

        <Text className="text-white text-2xl font-bold mb-6 leading-snug">
          {question?.text ?? '오늘 하루 어떤 순간이 기억에 남아?'}
        </Text>

        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="솔직하게 써봐. 여기선 판단 없어."
          placeholderTextColor="#5F5E5A"
          multiline
          autoFocus
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 160 }}
        />
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={2} />
        <PrimaryButton label="다음" onPress={handleNext} />
        <PrimaryButton
          label="건너뛸게"
          variant="ghost"
          onPress={() =>
            router.push({ pathname: '/journal/response', params: { ...params, questionAnswer: '' } })
          }
        />
      </View>
    </ScreenWrapper>
  );
}
