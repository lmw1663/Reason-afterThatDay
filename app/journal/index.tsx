import { useEffect, useState } from 'react';
import { View, TextInput, ScrollView, Pressable, Text as RNText } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
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
  isRawModeAllowed,
  shouldShowShameGuiltEducation,
} from '@/constants/personaBranches';
import { resolvePersona, appliesRecommendation } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';
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
  // C-3-H: 다중 페르소나 충돌 해소 — 권장형 분기는 R5에 따라 effective(주)만 검사.
  const primaryPersona = usePersonaStore(s => s.primary);
  const secondaryPersona = usePersonaStore(s => s.secondary);
  const resolved = resolvePersona(primaryPersona, secondaryPersona);
  const effectivePersona = resolved.effective;
  const labelsForPersona = getEmotionLabelsForPersona(effectivePersona);
  const freeTextPlaceholder = getJournalFreeTextPlaceholder(effectivePersona);

  useScreenView('journal_mood', { persona_category: anonymizePersona(effectivePersona) });

  // shame≠guilt 카드는 *최초 1회만* — AsyncStorage로 보존 (매트릭스 정합)
  const [showShameGuiltCard, setShowShameGuiltCard] = useState(false);
  useEffect(() => {
    if (!appliesRecommendation(resolved, shouldShowShameGuiltEducation)) return;
    AsyncStorage.getItem(SHAME_GUILT_SEEN_KEY).then(v => {
      if (v !== '1') setShowShameGuiltCard(true);
    });
  }, [effectivePersona]);

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

  // G-13: 신체 신호는 *선택사항*이라 평소엔 접어두고 명시적으로 펼치는 collapsible 패턴.
  // 시각 경쟁자 9 → 7로 감소. 신호를 입력한 적이 있으면 자동 펼침 (draft 복원 포함).
  // 한 번 펼친 후 다시 접는 UI는 의도적으로 두지 않음 — 펼친 의지를 가진 사용자가
  // 다시 닫고 싶어할 빈도가 낮고, 토글 자체가 또 다른 시각 노이즈가 되기 때문.
  const [showPhysical, setShowPhysical] = useState(false);
  useEffect(() => {
    if (physicalSignals.length > 0 && !showPhysical) setShowPhysical(true);
  }, [physicalSignals.length]);

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
        <BackHeader />
        <Caption className="mb-2">이별 일기 · 1 / 4</Caption>
        <Heading className="mb-2">지금 감정 온도가 몇 도야?</Heading>

        {/* D-5: 분노 페르소나(P10)면 거칠게 모드로 우회 옵션. G-13: 4단계 진입과 *대등한*
            큰 카드로 박혀있어 분기 결정 부담 — 작은 chip으로 격하해 시각 무게 ↓ */}
        {isRawModeAllowed(effectivePersona) && (
          <Pressable
            onPress={() => router.push('/journal/raw-mode')}
            accessibilityRole="button"
            accessibilityLabel="거칠게 쓰는 모드로 이동"
            accessibilityHint="분노를 그대로 쏟아내고, 마지막에 함께 다른 감정도 봐"
            hitSlop={8}
            className="mb-4 self-start rounded-full py-2 px-4 flex-row items-center gap-2 active:opacity-70"
            style={{ backgroundColor: colors.overlayPurpleSoft }}
          >
            <Icon name="wind" size={14} color={colors.purple[400]} />
            <Caption className="text-purple-400 font-semibold">거칠게 써볼래</Caption>
          </Pressable>
        )}

        <View className="mt-2" />

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
          {/* G-13: 감정 라벨 선택 후 피드백 — 정서적으로 가장 중요한 한 줄. Caption에서
              Body로 격상하고 보라 강조로 시각 무게 충분히 부여. */}
          {emotionLabels.length > 0 && (
            <View
              className="mt-4 rounded-xl px-4 py-3 flex-row items-center gap-2"
              style={{ backgroundColor: colors.overlayPurpleSoft }}
            >
              <Icon name="leaf" size={16} color={colors.purple[400]} />
              <Body className="text-purple-400 font-medium flex-1">
                지금 그 감정, 정상적인 단계야.
              </Body>
            </View>
          )}
        </View>

        {/* G-13: 신체 신호는 선택사항이라 collapsible. 평소 접혀있고 명시적으로 펼침. */}
        <View className="mt-8 mb-2">
          {!showPhysical ? (
            <Pressable
              onPress={() => setShowPhysical(true)}
              accessibilityRole="button"
              accessibilityLabel="몸의 변화도 함께 보기"
              hitSlop={8}
              className="flex-row items-center gap-2 active:opacity-60 py-2"
            >
              <Icon name="plus" size={14} color={colors.gray[400]} />
              <Caption className="text-gray-500">몸의 변화도 함께 보기 (선택)</Caption>
            </Pressable>
          ) : (
            <>
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
            </>
          )}
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
                  <RNText className="text-purple-400 font-semibold">행동을 후회</RNText>
                  하는 죄책감은 회복으로 이어져.{' '}
                  <RNText className="text-purple-400 font-semibold">나라는 사람을 부정</RNText>
                  하는 수치심은 자기 처벌로 흘러. 오늘은 행동만 다뤄보자.
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
