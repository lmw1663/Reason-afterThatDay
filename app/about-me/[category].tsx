import { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { useUserStore } from '@/store/useUserStore';
import { colors } from '@/constants/colors';
import { STRENGTH_LABELS } from '@/constants/emotionLabels';
import { applyDurationContext } from '@/utils/durationContext';
import {
  fetchCurrentReflectionByCategory,
  updateReflection,
  type ReflectionCategory,
  type SelfReflection,
} from '@/api/selfReflections';

type CategoryConfig = {
  mainQuestion: string;
  subQuestions?: string[];
  hasScore?: boolean;
  hasLabels?: boolean;
};

const CATEGORY_CONFIGS: Record<ReflectionCategory, CategoryConfig> = {
  love_self: {
    mainQuestion: '연애할 때 너는 어떤 사람이야?',
    subQuestions: ['내가 가장 잘 표현하는 사랑의 방식은?', '상대방에게 무엇을 줬어?'],
  },
  ideal_match: {
    mainQuestion: '어떤 사람이랑 잘 맞을 것 같아?',
    subQuestions: ['관계에서 가장 중요한 가치는?', '양보할 수 없는 것 / 양보 가능한 것'],
  },
  self_love: {
    mainQuestion: '너는 너를 얼마나 사랑해?',
    hasScore: true,
  },
  strengths: {
    mainQuestion: '너의 장점이 뭐야?',
    hasLabels: true,
  },
  self_care_in_relationship: {
    mainQuestion: '연애할 때 뭐로 스트레스 풀었어?',
    subQuestions: ['관계가 힘들 때 너를 살린 것', '혼자만의 시간이 어떻게 도움됐어?'],
  },
  self_care_alone: {
    mainQuestion: '연애 안 할 때 뭐로 스트레스 풀었어?',
    subQuestions: ['혼자 있을 때 가장 행복한 순간', '너를 채워주는 것들'],
  },
};

export default function ReflectionCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: ReflectionCategory }>();
  const { userId, relationshipDuration, daysElapsed } = useUserStore();

  const [current, setCurrent] = useState<SelfReflection | null>(null);
  const [score, setScore] = useState(5);
  const [labels, setLabels] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = CATEGORY_CONFIGS[category] ?? CATEGORY_CONFIGS.love_self;

  useEffect(() => {
    if (!userId) return;
    fetchCurrentReflectionByCategory(userId, category).then((r) => {
      setCurrent(r);
      if (r) {
        setScore(r.score ?? 5);
        setLabels(r.labels ?? []);
        setText(r.textResponse ?? '');
      }
    });
  }, [userId, category]);

  function toggleLabel(label: string) {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  async function handleSave() {
    if (!userId) {
      setSaveError('로그인 정보가 없어. 앱을 다시 켜볼래?');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateReflection(userId, category, { score, labels, textResponse: text });
      router.back();
    } catch (e) {
      const err = e as { message?: string; code?: string; details?: string };
      const detail = err.code
        ? `${err.code}: ${err.message ?? ''}`
        : err.message ?? '알 수 없는 오류';
      console.warn('[about-me] save failed:', e);
      setSaveError(`저장 실패 — ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  const mainQuestion = applyDurationContext(config.mainQuestion, relationshipDuration ?? null);

  const progressMessage = (() => {
    if (category !== 'self_love' || !current?.score) return null;
    const diff = score - current.score;
    if (Math.abs(diff) < 1) return null;
    if (diff > 0) return `${current.score}점 → ${score}점. 너 자신을 더 사랑하게 됐네.`;
    return `${current.score}점 → ${score}점. 요즘 힘든가 봐. 그것도 정상이야.`;
  })();

  return (
    <ScreenWrapper keyboardAvoiding>
      <ErrorToast
        visible={!!saveError}
        message={saveError ?? ''}
        onHide={() => setSaveError(null)}
        action={{ label: '재시도', onPress: handleSave }}
      />
      <ScrollView
        className="flex-1 px-6 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader label="나에 대해" />
        <Heading className="mb-1">{mainQuestion}</Heading>

        {config.subQuestions?.map((q) => (
          <Caption key={q} className="text-gray-500 mb-1">{q}</Caption>
        ))}

        <View className="mt-6 mb-4">
          {current && (
            <Card className="mb-4 border border-gray-700">
              <Caption className="text-gray-500 mb-1">이전에 너는 이렇게 답했어:</Caption>
              {current.score != null && (
                <Caption className="text-purple-400">{current.score}/10</Caption>
              )}
              {(current.labels?.length ?? 0) > 0 && (
                <Caption className="text-gray-400">{current.labels.join(', ')}</Caption>
              )}
              {current.textResponse && (
                <Body className="text-gray-300 text-sm">{current.textResponse}</Body>
              )}
            </Card>
          )}

          {config.hasScore && (
            <View className="mb-6">
              <MoodSlider value={score} onChange={setScore} />
              {progressMessage && (
                <Caption className="text-teal-400 mt-3 text-center">{progressMessage}</Caption>
              )}
            </View>
          )}

          {config.hasLabels && (
            <View className="mb-6">
              <Body className="text-gray-300 mb-3">해당하는 강점을 골라봐</Body>
              <View className="flex-row flex-wrap gap-2">
                {STRENGTH_LABELS.map((label) => (
                  <Pill
                    key={label}
                    label={label}
                    selected={labels.includes(label)}
                    onPress={() => toggleLabel(label)}
                  />
                ))}
              </View>
              {labels.length > 0 && (
                <Caption className="text-purple-400 mt-3">
                  너의 좋은 점 {labels.length}가지를 발견했네.
                </Caption>
              )}
            </View>
          )}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="솔직하게 써봐. 여기선 판단 없어."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={200}
            className="text-white text-base leading-relaxed"
            style={{ minHeight: 120 }}
          />
          <Caption className="text-gray-600 text-right mt-1">{text.length}/200</Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={current ? '수정하기' : '저장하기'}
          onPress={handleSave}
          loading={saving}
          disabled={!config.hasScore && !config.hasLabels && !text.trim()}
        />
      </View>
    </ScreenWrapper>
  );
}
