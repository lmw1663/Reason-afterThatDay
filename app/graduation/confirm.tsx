import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const QUESTIONS = [
  { id: 'q1', text: '이 결정이 두려움이 아닌 성장에서 온 건지 생각해봤어?' },
  { id: 'q2', text: '상대방과의 기억을 소중히 간직할 준비가 됐어?' },
  { id: 'q3', text: '다음 챕터를 향해 한 발 내딛을 준비가 됐어?' },
];

export default function GraduationConfirmScreen() {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);
  const allYes = QUESTIONS.every((q) => answers[q.id] === 'yes');

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">졸업 · 3 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">마지막으로 확인해볼게</Text>
        <Text className="text-gray-400 text-sm mb-8">
          후회 없는 결정을 위해 천천히 답해봐.
        </Text>

        {QUESTIONS.map((q) => (
          <View key={q.id} className="mb-6">
            <Text className="text-white text-base font-medium mb-3">{q.text}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['yes', 'no'] as const).map((val) => (
                <View key={val} style={{ flex: 1 }}>
                  <ChoiceButton
                    label={val === 'yes' ? '그래' : '아직 아니야'}
                    selected={answers[q.id] === val}
                    onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {allAnswered && !allYes && (
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(186,117,23,0.1)', borderWidth: 1, borderColor: '#BA7517' }}>
            <Text className="text-amber-400 text-sm leading-relaxed">
              아직 준비가 완전히 된 건 아닌 것 같아. 조금 더 시간을 갖는 것도 좋아. 돌아가도 괜찮아.
            </Text>
          </View>
        )}
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={allYes ? '졸업 신청하기' : '다음'}
          onPress={() => router.push('/graduation/request')}
          disabled={!allAnswered}
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
