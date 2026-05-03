import { useEffect, useState } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Caption, Heading, Body } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import {
  PHYSICAL_SIGNALS,
  PHYSICAL_SIGNAL_LABELS,
  getEmotionLabelsForPersona,
} from '@/constants/emotionLabels';
import { useJournalDraft, type JournalDraft } from '@/hooks/useJournalDraft';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getJournalFreeTextPlaceholder,
  shouldShowShameGuiltEducation,
} from '@/constants/personaBranches';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

const SHAME_GUILT_SEEN_KEY = 'persona_shame_guilt_education_seen';

export default function JournalMoodScreen() {
  const [score, setScore] = useState(5);
  const [emotionLabels, setEmotionLabels] = useState<string[]>([]);
  const [physicalSignals, setPhysicalSignals] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<JournalDraft | null>(null);

  // 페르소나별 감정 라벨 정렬 (C-2-G-3a) — P08은 "공허/멍함/시들음" 우선 노출.
  // C-2-G-3b: 자유 메모 placeholder + P14 shame≠guilt 안내 카드 분기.
  const primaryPersona = usePersonaStore(s => s.primary);
  const labelsForPersona = getEmotionLabelsForPersona(primaryPersona);
  const freeTextPlaceholder = getJournalFreeTextPlaceholder(primaryPersona);

  // shame≠guilt 카드는 *최초 1회만* — AsyncStorage로 보존 (매트릭스 정합)
  const [showShameGuiltCard, setShowShameGuiltCard] = useState(false);
  useEffect(() => {
    if (!shouldShowShameGuiltEducation(primaryPersona)) return;
    AsyncStorage.getItem(SHAME_GUILT_SEEN_KEY).then(v => {
      if (v !== '1') setShowShameGuiltCard(true);
    });
  }, [primaryPersona]);

  function dismissShameGuiltCard() {
    setShowShameGuiltCard(false);
    AsyncStorage.setItem(SHAME_GUILT_SEEN_KEY, '1').catch(() => {/* fail open */});
  }

  const { saveDraft, loadDraft, clearDraft } = useJournalDraft();

  // 진입 시 draft 확인
  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) {
        setPendingDraft(draft);
        setShowDraftRestore(true);
      }
    });
  }, []);

  function buildDraft(): JournalDraft {
    return {
      step: 1,
      mood: { moodScore: score, moodLabel: emotionLabels, physicalSignals, freeText },
      direction: { direction: null, affectionLevel: 5 },
      question: { answerText: '' },
      savedAt: Date.now(),
    };
  }

  function toggleLabel(label: string) {
    const next = emotionLabels.includes(label)
      ? emotionLabels.filter((x) => x !== label)
      : [...emotionLabels, label];
    setEmotionLabels(next);
    saveDraft({ ...buildDraft(), mood: { ...buildDraft().mood, moodLabel: next } });
  }

  function toggleSignal(signal: string) {
    const next = physicalSignals.includes(signal)
      ? physicalSignals.filter((x) => x !== signal)
      : [...physicalSignals, signal];
    setPhysicalSignals(next);
    saveDraft({ ...buildDraft(), mood: { ...buildDraft().mood, physicalSignals: next } });
  }

  function handleScoreChange(value: number) {
    setScore(value);
    saveDraft({ ...buildDraft(), mood: { ...buildDraft().mood, moodScore: value } });
  }

  function handleRestoreDraft() {
    if (!pendingDraft) return;
    const { moodScore, moodLabel, physicalSignals: ps, freeText: ft } = pendingDraft.mood;
    setScore(moodScore);
    setEmotionLabels(moodLabel);
    setPhysicalSignals(ps);
    setFreeText(ft);
    setShowDraftRestore(false);
    setPendingDraft(null);
  }

  async function handleDiscardDraft() {
    await clearDraft();
    setShowDraftRestore(false);
    setPendingDraft(null);
  }

  async function handleNext() {
    await saveDraft(buildDraft());
    router.push({
      pathname: '/journal/direction',
      params: {
        score: String(score),
        tags: emotionLabels.join(','),
        physicalSignals: physicalSignals.join(','),
        freeText,
      },
    });
  }

  const draftTimeLabel = pendingDraft
    ? new Date(pendingDraft.savedAt).toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <ScreenWrapper keyboardAvoiding>
      <Modal
        visible={showDraftRestore}
        onClose={handleDiscardDraft}
        title="이어서 쓸래?"
        description={`${draftTimeLabel}에 저장된 일기가 있어.`}
        primaryLabel="이어서 쓰기"
        onPrimary={handleRestoreDraft}
        secondaryLabel="새로 쓰기"
        onSecondary={handleDiscardDraft}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Caption className="mb-2">이별 일기 · 1 / 4</Caption>
        <Heading className="mb-8">지금 감정 온도가 몇 도야?</Heading>

        <MoodSlider value={score} onChange={handleScoreChange} />

        {/* 1.5단계: 감정 라벨 다중 선택 */}
        <View className="mt-10 mb-2">
          <Body className="text-gray-300 mb-1">어떤 감정인지 골라봐</Body>
          <Caption className="text-gray-500 mb-4">여러 개 동시에 느껴도 돼</Caption>
          <View className="flex-row flex-wrap gap-2">
            {labelsForPersona.map((label) => (
              <Pill
                key={label}
                label={label}
                selected={emotionLabels.includes(label)}
                onPress={() => toggleLabel(label)}
              />
            ))}
          </View>
          {emotionLabels.length > 0 && (
            <Caption className="mt-3 text-purple-400">
              지금 그 감정, 정상적인 단계야.
            </Caption>
          )}
        </View>

        {/* 1.6단계: 신체 신호 (선택사항) */}
        <View className="mt-8 mb-2">
          <Body className="text-gray-300 mb-1">몸도 변화가 있었어?</Body>
          <Caption className="text-gray-500 mb-4">선택사항이야, 건너뛰어도 돼</Caption>
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
                  <Body className="text-white text-xs leading-none">✓</Body>
                )}
              </View>
              <Body className="text-gray-300">{PHYSICAL_SIGNAL_LABELS[signal]}</Body>
            </Pressable>
          ))}
        </View>

        {/* C-2-G-3b: P14 (외도 가해 후회) — 일기 진입 시 *수치심 ≠ 죄책감* 심리교육 1회 노출.
            AsyncStorage 키 SHAME_GUILT_SEEN_KEY로 dismiss 추적 — 매번 노출 시 피로 차단. */}
        {showShameGuiltCard && (
          <Card className="mt-6 p-4">
            <View className="flex-row items-start gap-3">
              <Icon name="scale" size={20} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">수치심과 죄책감은 달라</Body>
                <Caption className="text-gray-400 leading-5">
                  *행동을 후회*하는 죄책감은 회복으로 이어져. *나라는 사람을 부정*하는 수치심은
                  자기 처벌로 흘러. 오늘은 행동만 다뤄보자.
                </Caption>
                <Pressable
                  onPress={dismissShameGuiltCard}
                  accessibilityRole="button"
                  accessibilityLabel="안내 닫기"
                  hitSlop={8}
                  className="mt-2 self-start active:opacity-60"
                >
                  <Caption className="text-purple-400">알겠어 ›</Caption>
                </Pressable>
              </View>
            </View>
          </Card>
        )}

        {/* 1.7단계: 자유 메모 (기존 위치 유지) */}
        <View className="mt-6 mb-4">
          <TextInput
            value={freeText}
            onChangeText={setFreeText}
            placeholder={freeTextPlaceholder}
            placeholderTextColor={colors.gray[600]}
            multiline
            accessibilityLabel="감정 자유 메모 (선택)"
            className="text-white text-base leading-relaxed"
            style={{ minHeight: 80 }}
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
