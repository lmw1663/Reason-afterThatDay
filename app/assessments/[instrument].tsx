import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { ErrorToast } from '@/components/ui/ErrorToast';
import {
  AssessmentSlider,
  PHQ_GAD_LABELS,
  RSE_LABELS,
} from '@/components/ui/AssessmentSlider';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { recordAssessment } from '@/api/assessments';
import { reverseRSE, type Instrument, type Source } from '@/utils/scoring';
import { useScreenView } from '@/hooks/useScreenView';
import items from '@/resources/assessment-items.json';

// D-2 검사 진행 화면 (구현계획 §3-2-B).
//
// 정책:
//  · 1문항 = 1화면 (CLAUDE.md 채팅 UI 금지)
//  · "지금은 그만" 버튼 항상 표시 (검사 거부권, 검증 §2-10)
//  · 마지막 응답 후 자동 저장 + recovery-trace로 라우팅
//  · 응답값은 0~3 (PHQ_GAD/RSE 동일). RSE만 역코딩(3·5·8·9·10) 적용 후 저장
//
// 라우트: /assessments/PHQ9?source=d7

type ItemBank = {
  title: string;
  subtitle: string;
  scale: 'PHQ_GAD' | 'RSE';
  items: string[];
};
const BANK = items as unknown as Record<string, ItemBank>;
const SUPPORTED: ReadonlyArray<Instrument> = ['PHQ9', 'GAD7', 'RSE'];

export default function AssessmentScreen() {
  const params = useLocalSearchParams<{ instrument: string; source?: string }>();
  const instrument = (params.instrument ?? '').toUpperCase() as Instrument;
  const source = (params.source as Source) ?? 'manual';
  const { userId } = useUserStore();

  const bank = SUPPORTED.includes(instrument) ? BANK[instrument] : null;

  useScreenView('assessment', { screen: `assessment_${instrument.toLowerCase()}` });

  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = bank?.scale === 'RSE' ? RSE_LABELS : PHQ_GAD_LABELS;
  const total = bank?.items.length ?? 0;
  const isLast = step === total - 1;
  const currentValue = responses[step] ?? null;

  const progressDots = useMemo(() => {
    return Array.from({ length: total }).map((_, i) => i);
  }, [total]);

  if (!bank) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center px-6">
          <Heading className="mb-2">아직 준비 중인 검사야</Heading>
          <Caption className="text-gray-500 text-center">
            지원: PHQ9 · GAD7 · RSE
          </Caption>
          <View className="mt-6 w-full">
            <PrimaryButton label="돌아가기" onPress={() => router.back()} />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  function handleNext() {
    if (currentValue === null) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    handleSave();
  }

  async function handleSave() {
    if (!userId || saving) return;
    setSaving(true);
    setError(null);
    try {
      // responses 변환: { 0: v, 1: v, ... } → { item1: v, item2: v, ... }
      // RSE는 역코딩 적용
      const payload: Record<string, number> = {};
      for (const [idxStr, v] of Object.entries(responses)) {
        const idx = Number(idxStr);
        const itemNumber = idx + 1;
        const final = bank!.scale === 'RSE' ? reverseRSE(itemNumber, v) : v;
        payload[`item${itemNumber}`] = final;
      }
      await recordAssessment(userId, instrument, payload, source);
      router.replace('/recovery-trace' as Href);
    } catch {
      setError('저장이 안 됐어. 잠시 후 다시 시도해볼래?');
    } finally {
      setSaving(false);
    }
  }

  function handleStop() {
    // 검사 거부권 — 부분 응답은 저장하지 않고 그냥 돌아간다 (검증 §2-10).
    router.back();
  }

  return (
    <ScreenWrapper>
      <ErrorToast
        visible={!!error}
        message={error ?? ''}
        onHide={() => setError(null)}
        action={{ label: '재시도', onPress: handleSave }}
      />
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-2">
          <BackHeader
            label="이전 문항"
            onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
          />
          <Pressable
            onPress={handleStop}
            accessibilityRole="button"
            accessibilityLabel="지금은 그만"
            accessibilityHint="응답을 저장하지 않고 검사에서 나간다"
            hitSlop={8}
            className="active:opacity-60"
          >
            <Caption className="text-gray-500">지금은 그만</Caption>
          </Pressable>
        </View>

        <Caption className="mb-1 text-purple-400">
          {bank.title} · {step + 1} / {total}
        </Caption>
        <Heading className="mb-2">{bank.items[step]}</Heading>
        <Caption className="text-gray-500 mb-6">{bank.subtitle}</Caption>

        <AssessmentSlider
          value={currentValue}
          onChange={(v) => setResponses({ ...responses, [step]: v })}
          labels={labels}
          ariaLabel={`${bank.items[step]} 응답 강도`}
        />

        {/* 진행 도트 — 답변한 문항만 진하게 */}
        <View className="mt-8 flex-row gap-1.5 justify-center">
          {progressDots.map((i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor:
                  i === step
                    ? colors.purple[400]
                    : responses[i] !== undefined
                    ? colors.purple[600]
                    : colors.border,
              }}
            />
          ))}
        </View>

        {/* 디스클레이머 — 정답이 아니야 (CLAUDE.md 정신) */}
        <View
          className="mt-6 rounded-xl px-4 py-3 flex-row items-start gap-2"
          style={{ backgroundColor: colors.overlayPurpleSoft }}
        >
          <Icon name="leaf" size={16} color={colors.purple[400]} />
          <Caption className="text-gray-400 flex-1 leading-5">
            정답이 아니야 — 오늘 결을 보는 거야. 결과는 내부에서 메타포로
            보여줄게.
          </Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton
          label={
            saving ? '저장 중...' : isLast ? '완료하고 결과 보기' : '다음'
          }
          onPress={handleNext}
          loading={saving}
          disabled={currentValue === null}
        />
      </View>
    </ScreenWrapper>
  );
}
