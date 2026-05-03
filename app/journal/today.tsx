import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { Pill } from '@/components/ui/Pill';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import {
  EMOTION_LABELS,
  PHYSICAL_SIGNALS,
  PHYSICAL_SIGNAL_LABELS,
} from '@/constants/emotionLabels';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { fetchTodayEntry, upsertJournalEntry } from '@/api/journal';

const AFFECTION_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TodayJournalEditScreen() {
  const { userId } = useUserStore();
  const { todayEntry, upsertEntry } = useJournalStore();

  const [loading, setLoading] = useState(!todayEntry);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [moodScore, setMoodScore] = useState(todayEntry?.moodScore ?? 5);
  const [emotionLabels, setEmotionLabels] = useState<string[]>(todayEntry?.moodLabel ?? []);
  const [physicalSignals, setPhysicalSignals] = useState<string[]>(
    todayEntry?.physicalSignals ?? [],
  );
  const [direction, setDirection] = useState<Direction>(todayEntry?.direction ?? 'undecided');
  const [affectionLevel, setAffectionLevel] = useState<number>(
    todayEntry?.affectionLevel ?? 5,
  );
  const [freeText, setFreeText] = useState(todayEntry?.freeText ?? '');

  // todayEntry가 store에 없으면 서버에서 로드
  useEffect(() => {
    if (todayEntry || !userId) {
      setLoading(false);
      return;
    }
    fetchTodayEntry(userId)
      .then((entry) => {
        if (!entry) {
          // 오늘 작성한 일기가 없으면 새로 쓰러 보냄
          router.replace('/journal');
          return;
        }
        setMoodScore(entry.moodScore);
        setEmotionLabels(entry.moodLabel ?? []);
        setPhysicalSignals(entry.physicalSignals ?? []);
        setDirection(entry.direction);
        setAffectionLevel(entry.affectionLevel ?? 5);
        setFreeText(entry.freeText ?? '');
      })
      .catch(() => setSaveError('일기를 불러오지 못했어.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const aiResponse = todayEntry?.aiResponse;

  function toggleLabel(label: string) {
    setEmotionLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  function toggleSignal(signal: string) {
    setPhysicalSignals((prev) =>
      prev.includes(signal) ? prev.filter((s) => s !== signal) : [...prev, signal],
    );
  }

  async function handleSave() {
    if (!userId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await upsertJournalEntry({
        userId,
        moodScore,
        moodLabel: emotionLabels,
        physicalSignals,
        affectionLevel,
        direction,
        freeText: freeText.trim() || undefined,
        aiResponse: todayEntry?.aiResponse,
        isMiniMode: todayEntry?.isMiniMode ?? false,
      });
      upsertEntry(saved);
      router.replace('/(tabs)');
    } catch {
      setSaveError('저장이 안 됐어. 잠시 후 다시 시도해볼래?');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.purple[400]} />
        </View>
      </ScreenWrapper>
    );
  }

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
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader />
        <Heading className="mb-1">오늘 일기 이어쓰기</Heading>
        <Caption className="text-gray-500 mb-6">
          내용을 바꾸거나 더 적어도 돼. 같은 날엔 덮어써져.
        </Caption>

        {/* 감정 온도 */}
        <View className="mb-8">
          <Body className="text-gray-300 mb-4">감정 온도</Body>
          <MoodSlider value={moodScore} onChange={setMoodScore} />
        </View>

        {/* 감정 라벨 */}
        <View className="mb-8">
          <Body className="text-gray-300 mb-3">감정</Body>
          <View className="flex-row flex-wrap gap-2">
            {EMOTION_LABELS.map((label) => (
              <Pill
                key={label}
                label={label}
                selected={emotionLabels.includes(label)}
                onPress={() => toggleLabel(label)}
              />
            ))}
          </View>
        </View>

        {/* 신체 신호 */}
        <View className="mb-8">
          <Body className="text-gray-300 mb-3">몸의 변화</Body>
          {PHYSICAL_SIGNALS.map((signal) => (
            <Pressable
              key={signal}
              onPress={() => toggleSignal(signal)}
              className="flex-row items-center mb-3"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: physicalSignals.includes(signal) }}
            >
              <View
                className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                  physicalSignals.includes(signal)
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-500'
                }`}
              >
                {physicalSignals.includes(signal) && (
                  <Icon name="check" size={12} color={colors.white} strokeWidth={2.5} />
                )}
              </View>
              <Body className="text-gray-300">{PHYSICAL_SIGNAL_LABELS[signal]}</Body>
            </Pressable>
          ))}
        </View>

        {/* 방향 */}
        <View className="mb-8">
          <Body className="text-gray-300 mb-3">방향</Body>
          <DirectionPicker value={direction} onChange={setDirection} />
        </View>

        {/* 애정 수준 (방향 선택 시) */}
        {direction !== 'undecided' && (
          <View className="mb-8">
            <Body className="text-gray-300 mb-1">지금 상대를 어떻게 느껴?</Body>
            <Caption className="text-gray-500 mb-4">선택사항이야</Caption>
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
                      width: 18,
                      height: step === affectionLevel ? 44 : 24,
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
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 자유 메모 */}
        <View className="mb-8">
          <Body className="text-gray-300 mb-3">하고 싶은 말</Body>
          <TextInput
            value={freeText}
            onChangeText={setFreeText}
            placeholder="더 적고 싶은 게 있으면 써봐"
            placeholderTextColor={colors.gray[600]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="자유 메모"
            className="text-white text-base px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 120,
            }}
          />
        </View>

        {/* AI 응답 (읽기 전용) */}
        {aiResponse && (
          <View className="mb-4">
            <InsightCard tag="그날의 한마디" body={aiResponse} accent="purple" />
            <Caption className="text-gray-600 mt-2 text-center">
              AI 응답은 처음 작성 시점 기준이야
            </Caption>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton
          label={saving ? '저장 중...' : '저장하기'}
          onPress={handleSave}
          loading={saving}
          disabled={!userId}
        />
      </View>
    </ScreenWrapper>
  );
}
