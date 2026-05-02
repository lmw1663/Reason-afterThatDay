import { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { Pill } from '@/components/ui/Pill';
import { InsightCard } from '@/components/ui/InsightCard';
import { Caption, Heading, Body } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { EMOTION_LABELS } from '@/constants/emotionLabels';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { upsertJournalEntry } from '@/api/journal';

/**
 * 일기 미니 모드 — 무기력 단계 사용자 진입 장벽 낮추기.
 * 감정 온도(필수) + 빠른 라벨(선택, 0~1개) 만 기록.
 * physical_signals/free_text/ai_response 는 생략.
 * is_mini_mode = true, direction = 'undecided' 로 저장.
 */
export default function JournalMiniScreen() {
  const [score, setScore] = useState(5);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { userId } = useUserStore();
  const { upsertEntry } = useJournalStore();

  function toggleLabel(label: string) {
    // 0~1개만 — 같은 라벨 누르면 해제, 다른 라벨 누르면 교체
    setSelectedLabel((cur) => (cur === label ? null : label));
  }

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);

    const labels = selectedLabel ? [selectedLabel] : [];
    const nowIso = new Date().toISOString();

    // 로컬 즉시 반영 — 오프라인이거나 저장 실패해도 UI에 표시되도록.
    const localEntry = {
      id: `local-${Date.now()}`,
      userId: userId ?? 'local',
      createdAt: nowIso,
      moodScore: score,
      moodLabel: labels,
      physicalSignals: [],
      affectionLevel: null,
      direction: 'undecided' as const,
      isMiniMode: true,
    };
    upsertEntry(localEntry);

    if (!userId) {
      setSaving(false);
      setSaved(true);
      return;
    }

    try {
      const savedEntry = await upsertJournalEntry({
        userId,
        moodScore: score,
        moodLabel: labels,
        physicalSignals: [],
        affectionLevel: null,
        direction: 'undecided',
        isMiniMode: true,
      });
      upsertEntry(savedEntry);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      console.warn('[journal mini] save failed:', err.code ?? err.message ?? e);
    } finally {
      setSaving(false);
      setSaved(true);
    }
  }

  if (saved) {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14">
          <Caption className="mb-2">이별 일기 · 미니</Caption>
          <Heading className="mb-8">기록했어</Heading>

          <InsightCard
            tag="오늘의 한마디"
            body={'오늘도 기록했어. 고마워.\n무기력한 날엔 이만큼이면 충분해.'}
            accent="purple"
          />
        </View>

        <View className="px-6 pb-10 gap-3">
          <PrimaryButton
            label="더 깊게 쓸래?"
            variant="ghost"
            onPress={() => router.replace('/journal')}
          />
          <PrimaryButton label="홈으로" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">이별 일기 · 미니</Caption>
        <Heading className="mb-2">지금 기분이 어때?</Heading>
        <Caption className="mb-8 text-gray-500">
          오늘은 이만큼만 기록해도 돼.
        </Caption>

        <MoodSlider value={score} onChange={setScore} />

        <View className="mt-10 mb-2">
          <Body className="text-gray-300 mb-1">한 단어로 표현하면?</Body>
          <Caption className="text-gray-500 mb-4">건너뛰어도 돼 · 하나만 골라봐</Caption>
          <View className="flex-row flex-wrap gap-2">
            {EMOTION_LABELS.map((label) => (
              <Pill
                key={label}
                label={label}
                selected={selectedLabel === label}
                onPress={() => toggleLabel(label)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        {saving ? (
          <View className="py-4 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : (
          <PrimaryButton label="기록하기" onPress={handleSave} />
        )}
      </View>
    </ScreenWrapper>
  );
}
