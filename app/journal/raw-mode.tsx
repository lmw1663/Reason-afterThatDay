import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { countRawModeToday, upsertJournalEntry } from '@/api/journal';
import { useScreenView } from '@/hooks/useScreenView';
import { trackEvent } from '@/api/telemetry';
import { anonymizePersona } from '@/utils/telemetryHelpers';
import { usePersonaStore } from '@/store/usePersonaStore';

// D-5 P10 분노 모드 — 거칠게 venting + 종료 전 강제 2차 정서 통합.
//
// 정책:
//  · 진입 시 오늘 raw-mode 행 ≥ 2면 차단 → 일반 일기로 우회
//  · venting 단계는 자유 텍스트만, 감정 라벨/방향 등 제거 (거칠게)
//  · 저장 *전* 2차 정서 1개 강제 — 분노 단독 venting의 반추 강화 차단
//  · is_raw_mode=true + secondary_emotion=선택값으로 journal_entries에 저장
//    (일반 일기 동일 row에 raw 플래그 — 회복 추적·통계 정합)
//  · direction은 'undecided' 고정 (분노 시 결정 강제 금지 — 매트릭스 §2 C5 P10 정합)

const SECONDARY_EMOTIONS = [
  { key: '슬픔',     hint: '잃은 것 자체에 대한 슬픔' },
  { key: '두려움',   hint: '앞으로 어떻게 될지 모르는 두려움' },
  { key: '상처',     hint: '나의 마음이 다친 자리' },
  { key: '수치',     hint: '"내가 부족했나" 자기 향한 화살' },
  { key: '무력감',   hint: '바꿀 수 없는 것에 대한 막막함' },
];

const DAILY_LIMIT = 2;

type Step = 'gate' | 'vent' | 'integrate';

export default function RawModeScreen() {
  const { userId } = useUserStore();
  const { upsertEntry } = useJournalStore();
  const personaPrimary = usePersonaStore((s) => s.primary);

  const [step, setStep] = useState<Step>('gate');
  const [moodScore, setMoodScore] = useState(3); // 분노 시 보통 낮음 — 사용자 입력 없이 기본값
  const [vent, setVent] = useState('');
  const [secondary, setSecondary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useScreenView('journal_raw_mode', { persona_category: anonymizePersona(personaPrimary) });

  // 게이트 — 진입 시 오늘 카운트 확인
  useEffect(() => {
    if (!userId) return;
    countRawModeToday(userId)
      .then((count) => {
        if (count >= DAILY_LIMIT) {
          // 2회 도달 시 안내 후 일반 일기로 우회
          setError(`오늘 거칠게 모드는 ${DAILY_LIMIT}번까지야. 일반 일기로 갈게.`);
          setTimeout(() => router.replace('/journal'), 1800);
          return;
        }
        setStep('vent');
      })
      .catch(() => setStep('vent')); // 에러 시 fail-open (RLS 신뢰)
  }, [userId]);

  async function handleSave() {
    if (!userId || !secondary || saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertJournalEntry({
        userId,
        moodScore,
        moodLabel: ['분노'],
        physicalSignals: [],
        direction: 'undecided',
        freeText: vent.trim() || undefined,
        isRawMode: true,
        secondaryEmotion: secondary,
      });
      upsertEntry(saved);
      trackEvent('persona_branch_applied', {
        screen: 'journal_raw_mode',
        branch: 'raw_mode_completed',
        persona_category: anonymizePersona(personaPrimary),
        secondary_emotion: secondary,
      });
      router.replace('/(tabs)');
    } catch {
      setError('저장이 안 됐어. 잠시 후 다시 시도해볼래?');
    } finally {
      setSaving(false);
    }
  }

  if (step === 'gate') {
    return (
      <ScreenWrapper>
        <ErrorToast
          visible={!!error}
          message={error ?? ''}
          onHide={() => setError(null)}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.purple[400]} />
        </View>
      </ScreenWrapper>
    );
  }

  if (step === 'vent') {
    return (
      <ScreenWrapper keyboardAvoiding>
        <ErrorToast
          visible={!!error}
          message={error ?? ''}
          onHide={() => setError(null)}
        />
        <ScrollView
          className="flex-1 px-6 pt-14"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackHeader />
          <Heading className="mb-1">거칠게 써도 돼</Heading>
          <Caption className="text-gray-500 mb-6">
            욕도, 끊긴 문장도 괜찮아. 너만 읽는 글이야.
          </Caption>

          <TextInput
            value={vent}
            onChangeText={setVent}
            placeholder="지금 가장 화나는 그것 — 그냥 쏟아내봐"
            placeholderTextColor={colors.gray[600]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="분노 자유 표출"
            className="text-white text-base px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 240,
            }}
          />

          <View
            className="mt-6 rounded-xl px-4 py-3 flex-row items-start gap-2"
            style={{ backgroundColor: colors.overlayPurpleSoft }}
          >
            <Icon name="shield" size={16} color={colors.purple[400]} />
            <Caption className="text-gray-400 flex-1 leading-5">
              저장 전에 한 단계 더 — 이 분노 아래에 어떤 마음이 있는지 함께 보자.
            </Caption>
          </View>
        </ScrollView>

        <View className="px-6 pb-10 gap-2">
          <PrimaryButton
            label="다음 — 분노 아래 마음 보기"
            onPress={() => setStep('integrate')}
            disabled={vent.trim().length === 0}
          />
        </View>
      </ScreenWrapper>
    );
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
        <BackHeader onPress={() => setStep('vent')} />
        <Heading className="mb-1">이 분노 아래에 어떤 마음이 있을까?</Heading>
        <Caption className="text-gray-500 mb-6">
          하나만 골라봐. 정답이 아니야 — 가장 가까운 걸로.
        </Caption>

        <View className="gap-3">
          {SECONDARY_EMOTIONS.map((e) => {
            const active = secondary === e.key;
            return (
              <Pressable
                key={e.key}
                onPress={() => setSecondary(e.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${e.key} — ${e.hint}`}
                className="rounded-2xl px-4 py-4 active:opacity-80"
                style={{
                  backgroundColor: active ? colors.purple[600] : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.purple[400] : colors.border,
                }}
              >
                <Text
                  className={`text-base font-semibold ${active ? 'text-white' : 'text-gray-200'}`}
                >
                  {e.key}
                </Text>
                <Caption
                  className={`mt-1 ${active ? 'text-purple-50 opacity-90' : 'text-gray-500'}`}
                >
                  {e.hint}
                </Caption>
              </Pressable>
            );
          })}
        </View>

        <View
          className="mt-6 rounded-xl px-4 py-3 flex-row items-start gap-2"
          style={{ backgroundColor: colors.overlayPurpleSoft }}
        >
          <Icon name="leaf" size={16} color={colors.purple[400]} />
          <Caption className="text-gray-400 flex-1 leading-5">
            분노는 다른 감정의 *겉모양*인 경우가 많아. 아래를 봐주는 것만으로
            소화가 시작돼.
          </Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton
          label={saving ? '저장 중...' : '저장하기'}
          onPress={handleSave}
          loading={saving}
          disabled={!secondary}
        />
      </View>
    </ScreenWrapper>
  );
}
