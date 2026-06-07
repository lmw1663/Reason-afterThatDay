import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';
import { PHYSICAL_SIGNALS, PHYSICAL_SIGNAL_LABELS } from '@/constants/emotionLabels';
import { useJournalDraft, type JournalDraft } from '@/hooks/useJournalDraft';
import { usePersonaStore } from '@/store/usePersonaStore';
import { resolvePersona } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';

/**
 * 일기 step 1-3 — 몸의 변화 (3 / 3)
 *
 * 신체 신호 4종 (수면·식욕·멍함·잦은 울음). 선택사항이라 건너뛰어도 OK.
 * 단독 화면이라 기존 collapsible 패턴은 제거 — 항목 4개만 노출.
 */
export default function JournalPhysicalScreen() {
  const [physicalSignals, setPhysicalSignals] = useState<string[]>([]);
  const [draft, setDraft] = useState<JournalDraft | null>(null);

  const primaryPersona = usePersonaStore((s) => s.primary);
  const secondaryPersona = usePersonaStore((s) => s.secondary);
  const resolved = resolvePersona(primaryPersona, secondaryPersona);

  useScreenView('journal_physical', {
    persona_category: anonymizePersona(resolved.effective),
  });

  const { saveDraft, loadDraft } = useJournalDraft();

  useEffect(() => {
    loadDraft().then((d) => {
      if (!d) {
        router.replace('/journal');
        return;
      }
      setDraft(d);
      setPhysicalSignals(d.mood.physicalSignals);
    });
  }, []);

  function buildDraft(next: string[]): JournalDraft {
    if (!draft) {
      return {
        step: 1,
        mood: { moodScore: 5, moodLabel: [], physicalSignals: next, freeText: '' },
        direction: { direction: null, affectionLevel: 5 },
        question: { answerText: '' },
        savedAt: Date.now(),
      };
    }
    return {
      ...draft,
      mood: { ...draft.mood, physicalSignals: next },
      savedAt: Date.now(),
    };
  }

  function toggleSignal(signal: string) {
    if (!draft) return; // draft load 전 race 가드
    const next = physicalSignals.includes(signal)
      ? physicalSignals.filter((x) => x !== signal)
      : [...physicalSignals, signal];
    setPhysicalSignals(next);
    saveDraft(buildDraft(next));
  }

  async function handleNext() {
    await saveDraft(buildDraft(physicalSignals));
    router.push({
      pathname: '/journal/direction',
      params: {
        score: String(draft?.mood.moodScore ?? 5),
        tags: (draft?.mood.moodLabel ?? []).join(','),
        physicalSignals: physicalSignals.join(','),
        freeText: draft?.mood.freeText ?? '',
      },
    });
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader />
        <Caption className="mb-2">이별 일기 · 1 / 4 · 몸의 변화</Caption>
        <Heading className="mb-2">몸도 변화가 있었어?</Heading>
        <Caption className="text-gray-500 mb-6">선택사항이야, 건너뛰어도 돼</Caption>

        <View className="gap-2">
          {PHYSICAL_SIGNALS.map((signal) => {
            const checked = physicalSignals.includes(signal);
            return (
              <Pressable
                key={signal}
                onPress={() => toggleSignal(signal)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={PHYSICAL_SIGNAL_LABELS[signal]}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: checked ? colors.purple[400] : colors.border,
                  backgroundColor: checked ? colors.overlayPurpleSoft : colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 14,
                }}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: checked ? colors.purple[400] : colors.gray[600],
                    backgroundColor: checked ? colors.purple[400] : 'transparent',
                  }}
                >
                  {checked && (
                    <Body
                      style={{
                        color: colors.white,
                        fontSize: 12,
                        fontWeight: '700',
                        lineHeight: 14,
                      }}
                    >
                      ✓
                    </Body>
                  )}
                </View>
                <Body className="text-gray-50 flex-1">{PHYSICAL_SIGNAL_LABELS[signal]}</Body>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
