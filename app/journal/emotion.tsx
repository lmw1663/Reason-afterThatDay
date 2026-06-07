import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, Text as RNText, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { EmotionPickerCard } from '@/components/ui/EmotionPickerCard';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { getEmotionLabelsForPersona } from '@/constants/emotionLabels';
import { useJournalDraft, type JournalDraft } from '@/hooks/useJournalDraft';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getJournalFreeTextPlaceholder,
  shouldShowShameGuiltEducation,
} from '@/constants/personaBranches';
import { resolvePersona, appliesRecommendation } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';

const SHAME_GUILT_SEEN_KEY = 'persona_shame_guilt_education_seen';

/**
 * 일기 step 1-2 — 감정 라벨 + 자유 메모 (2 / 3)
 *
 * 페르소나별 정렬(C-2-G-3a P08)·shame-guilt 카드(C-2-G-3b P14)·자유 메모
 * placeholder를 한 화면에 묶음. mood 화면(1/3)에서 draft 저장 후 진입.
 */
export default function JournalEmotionScreen() {
  const [emotionLabels, setEmotionLabels] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [draft, setDraft] = useState<JournalDraft | null>(null);

  const primaryPersona = usePersonaStore((s) => s.primary);
  const secondaryPersona = usePersonaStore((s) => s.secondary);
  const resolved = resolvePersona(primaryPersona, secondaryPersona);
  const effectivePersona = resolved.effective;
  const labelsForPersona = getEmotionLabelsForPersona(effectivePersona);
  const freeTextPlaceholder = getJournalFreeTextPlaceholder(effectivePersona);

  useScreenView('journal_emotion', { persona_category: anonymizePersona(effectivePersona) });

  // C-2-G-3b P14 — shame≠guilt 안내 (1회만)
  const [showShameGuiltCard, setShowShameGuiltCard] = useState(false);
  useEffect(() => {
    if (!appliesRecommendation(resolved, shouldShowShameGuiltEducation)) return;
    AsyncStorage.getItem(SHAME_GUILT_SEEN_KEY).then((v) => {
      if (v !== '1') setShowShameGuiltCard(true);
    });
  }, [effectivePersona]);

  function dismissShameGuiltCard() {
    setShowShameGuiltCard(false);
    AsyncStorage.setItem(SHAME_GUILT_SEEN_KEY, '1').catch(() => {/* fail open */});
  }

  const { saveDraft, loadDraft } = useJournalDraft();

  // 진입 시 draft 복원 (mood 화면에서 저장된 상태)
  useEffect(() => {
    loadDraft().then((d) => {
      if (!d) {
        // draft 없으면 mood 화면으로 돌려보냄 (직접 url 진입 차단)
        router.replace('/journal');
        return;
      }
      setDraft(d);
      setEmotionLabels(d.mood.moodLabel);
      setFreeText(d.mood.freeText);
    });
  }, []);

  function buildDraft(nextLabels: string[], nextText: string): JournalDraft {
    if (!draft) {
      // 안전망 — 보통 진입 시 draft가 있어야 하지만 null이면 직접 생성
      return {
        step: 1,
        mood: { moodScore: 5, moodLabel: nextLabels, physicalSignals: [], freeText: nextText },
        direction: { direction: null, affectionLevel: 5 },
        question: { answerText: '' },
        savedAt: Date.now(),
      };
    }
    return {
      ...draft,
      mood: { ...draft.mood, moodLabel: nextLabels, freeText: nextText },
      savedAt: Date.now(),
    };
  }

  function toggleLabel(label: string) {
    if (!draft) return; // draft load 전 race 가드
    const next = emotionLabels.includes(label)
      ? emotionLabels.filter((x) => x !== label)
      : [...emotionLabels, label];
    setEmotionLabels(next);
    saveDraft(buildDraft(next, freeText));
  }

  function handleFreeTextChange(value: string) {
    if (!draft) return; // race 가드
    setFreeText(value);
    saveDraft(buildDraft(emotionLabels, value));
  }

  async function handleNext() {
    await saveDraft(buildDraft(emotionLabels, freeText));
    router.push('/journal/physical');
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
        <BackHeader />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Caption className="mb-2">이별 일기 · 1 / 4 · 감정 라벨</Caption>
        <Heading className="mb-2">어떤 감정인지 골라봐</Heading>
        <Caption className="text-gray-500 mb-6">여러 개 동시에 느껴도 돼</Caption>

        <EmotionPickerCard
          emotions={labelsForPersona}
          selected={emotionLabels}
          onToggle={toggleLabel}
          columns={3}
        />

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

        {/* C-2-G-3b P14 — 외도 가해 후회 페르소나, 최초 1회만 */}
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

        {/* 자유 메모 */}
        <View className="mt-6 mb-4">
          <Body className="text-gray-300 mb-2">한 마디 더 적고 싶으면</Body>
          <TextInput
            value={freeText}
            onChangeText={handleFreeTextChange}
            placeholder={freeTextPlaceholder}
            placeholderTextColor={colors.gray[600]}
            multiline
            accessibilityLabel="감정 자유 메모 (선택)"
            style={{
              fontFamily: 'Pretendard',
              color: colors.white,
              fontSize: 16,
              lineHeight: 24,
              minHeight: 80,
            }}
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
