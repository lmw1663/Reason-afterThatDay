import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { WeatherScene } from '@/components/ui/WeatherScene';
import { Modal } from '@/components/ui/Modal';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { useJournalDraft, type JournalDraft } from '@/hooks/useJournalDraft';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  isRawModeAllowed,
  isVisualStimulusBlockedByPersona,
} from '@/constants/personaBranches';
import { resolvePersona, appliesGuard } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';
import { Icon } from '@/components/ui/Icon';

/**
 * 일기 step 1-1 — 감정 온도 (1 / 3)
 *
 * 기존 한 화면에 묶여 있던 감정 온도·감정 라벨·신체 신호·자유 메모를 3 sub-step으로
 * 분리. 본 화면은 *온도*만. 상단 180px 날씨 신(WeatherScene)이 score에 따라
 * 폭풍우↔쾌청 끊김 없이 보간되어 시각 피드백.
 *
 * 임상 안전: P10(분노)·B-1 안전 잠금(decisionLocked) 등 자극 회피 컨텍스트에서는
 * WeatherScene의 disableLightning을 true로 — 본 화면 단계에선 P10만 검사
 * (decisionLocked는 일기 전체 흐름이 차단되지 않으므로 보수적으로 P10만 disable).
 */
export default function JournalMoodScreen() {
  const [score, setScore] = useState(5);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<JournalDraft | null>(null);
  // 모달 race 방지 — 모달이 떠 있는 동안 슬라이더 입력 차단
  const inputLocked = showDraftRestore;

  const primaryPersona = usePersonaStore((s) => s.primary);
  const secondaryPersona = usePersonaStore((s) => s.secondary);
  const resolved = resolvePersona(primaryPersona, secondaryPersona);
  const effectivePersona = resolved.effective;

  useScreenView('journal_mood', { persona_category: anonymizePersona(effectivePersona) });

  const { saveDraft, loadDraft, clearDraft } = useJournalDraft();

  // 진입 시 draft 확인 — draft가 있으면 score를 즉시 적용 + 모달로 사용자 의향 묻기.
  // 사용자가 모달 떠 있는 동안 슬라이더를 만져 복원 의도가 사라지는 race 방지.
  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) {
        setPendingDraft(draft);
        setScore(draft.mood.moodScore);
        setShowDraftRestore(true);
      }
    });
  }, []);

  function buildDraft(nextScore: number): JournalDraft {
    return {
      step: 1,
      mood: {
        moodScore: nextScore,
        moodLabel: pendingDraft?.mood.moodLabel ?? [],
        physicalSignals: pendingDraft?.mood.physicalSignals ?? [],
        freeText: pendingDraft?.mood.freeText ?? '',
      },
      direction: pendingDraft?.direction ?? { direction: null, affectionLevel: 5 },
      question: pendingDraft?.question ?? { answerText: '' },
      savedAt: Date.now(),
    };
  }

  function handleScoreChange(value: number) {
    if (inputLocked) return;
    setScore(value);
    saveDraft(buildDraft(value));
  }

  function handleRestoreDraft() {
    setShowDraftRestore(false);
  }

  async function handleDiscardDraft() {
    await clearDraft();
    setScore(5);
    setPendingDraft(null);
    setShowDraftRestore(false);
  }

  // 모달 close(터치 밖 등)는 dismiss만 — draft 보존
  function handleDismissModal() {
    setShowDraftRestore(false);
  }

  async function handleNext() {
    await saveDraft(buildDraft(score));
    router.push('/journal/emotion');
  }

  const draftTimeLabel = pendingDraft
    ? new Date(pendingDraft.savedAt).toLocaleString('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // 자극성 시각 효과 비활성 — 분노 우세 페르소나는 폭풍·번개가 격앙 트리거 가능.
  // appliesGuard가 primary + secondary 둘 다 검사 (C-3-H 다중 페르소나 보존).
  const disableLightning = appliesGuard(resolved, isVisualStimulusBlockedByPersona);

  // 가로 폭 — 화면 패딩 24*2 = 48 빼고
  const sceneWidth = Dimensions.get('window').width - 48;

  return (
    <ScreenWrapper keyboardAvoiding>
      <Modal
        visible={showDraftRestore}
        onClose={handleDismissModal}
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
        <Caption className="mb-2">이별 일기 · 1 / 4 · 감정 온도</Caption>
        <Heading className="mb-2">지금 감정 온도가 몇 도야?</Heading>

        {/* D-5 분노 페르소나(P10) — 거칠게 모드 우회 옵션 */}
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

        {/* 날씨 신 — score 끊김 없이 보간 */}
        <View className="mt-2 mb-6">
          <WeatherScene
            score={score}
            width={sceneWidth}
            height={180}
            disableLightning={disableLightning}
          />
        </View>

        <MoodSlider value={score} onChange={handleScoreChange} />
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
