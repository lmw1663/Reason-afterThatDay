import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Caption, Heading } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { fetchGraduationLetter } from '@/api/ai';
import { useKnotPolicy } from '@/hooks/useKnotPolicy';
import { useGraduationLockGuard } from '@/hooks/useGraduationLockGuard';
import { fetchResponseHistory, type ResponseHistoryEntry } from '@/api/questions';
import { FirstVsLatestCard } from '@/components/ui/FirstVsLatestCard';

// 졸업 편지에 회상 카드를 곁들일 핵심 질문 — v2 §4 "헤어진 이유" 변화 흐름.
// 마이그 037에서 a_breakup_reason 은 revisit_after_days=7 이라 충분한 history 누적 가능.
const LETTER_REFLECTION_QID = 'a_breakup_reason';
const LETTER_REFLECTION_TEXT = '처음에 적었던 헤어진 이유';

export default function GraduationLetterScreen() {
  const { userId, daysElapsed } = useUserStore();
  const { entries, stats } = useJournalStore();
  const { profile } = useRelationshipStore();
  const { checkinResponses } = useCoolingStore();
  const { label } = useKnotPolicy();
  // Phase G — 진입 후 C-SSRS 잠금 발생(예: cooling 중 위기 신호)으로 매듭 트랙이
  // 닫혔을 경우 letter 화면도 즉시 redirect. fail-open(서버 장애 시 unlocked).
  const lockState = useGraduationLockGuard();
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reflectionHistory, setReflectionHistory] = useState<ResponseHistoryEntry[]>([]);

  const moodAvg = stats?.moodTrend.length
    ? stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length
    : undefined;

  // 유예 체크인에서 감정 점수와 메모 추출
  const checkinMoods = (checkinResponses as Array<Record<string, unknown>>)
    .map((r) => r.mood_score as number)
    .filter(Boolean);
  const checkinNotes = (checkinResponses as Array<Record<string, unknown>>)
    .map((r) => r.note as string)
    .filter(Boolean);

  // Phase G — 카테고리 회상 입력. history.length === 1 fast path 처리:
  //   · 0건: undefined → 카드 미표시 + GPT 입력 미포함
  //   · 1건: first === latest 참조 동일 → 카드 미표시, GPT 에 reasonReflection=null
  //   · 2+건: 카드 표시 + GPT 에 reasonReflection 포함
  const reflectionFirst = reflectionHistory[0];
  const reflectionLatest = reflectionHistory[reflectionHistory.length - 1];
  const showReflectionCard = reflectionFirst && reflectionLatest && reflectionFirst !== reflectionLatest;

  // Phase G — 잠금/unlocked 확인 후 history 와 letter 를 직렬 fetch.
  // 이중 letter 호출(이전: history 도착 시 재발사)·lockState='loading' 단계 GPT 누설 모두 회피.
  useEffect(() => {
    if (lockState !== 'unlocked' || !userId) return;
    let cancelled = false;

    fetchResponseHistory(userId, LETTER_REFLECTION_QID)
      .then((history) => {
        if (cancelled) return history;
        setReflectionHistory(history);
        return history;
      })
      .catch(() => [] as ResponseHistoryEntry[])
      .then((history) => {
        if (cancelled) return;
        const first = history[0];
        const latest = history[history.length - 1];
        const haveDelta = first && latest && first !== latest;
        return fetchGraduationLetter({
          daysElapsed,
          moodAvg,
          reasons: profile.reasons,
          pros: profile.pros,
          cons: profile.cons,
          journalCount: entries.length,
          checkinMoods,
          checkinNotes,
          reasonReflection: haveDelta
            ? {
                first: { value: first.responseValue, dPlus: first.dPlus },
                latest: { value: latest.responseValue, dPlus: latest.dPlus },
              }
            : null,
        });
      })
      .then((text) => {
        if (cancelled || !text) return;
        setLetter(text);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lockState, userId]);

  // Phase G — 잠금 발생 시(loading→locked 전이 포함) 즉시 cooling 메인으로 redirect
  useEffect(() => {
    if (lockState === 'locked') router.replace('/(tabs)/' as never);
  }, [lockState]);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">{label} · 2 / 6</Caption>
        <Heading className="mb-8">나에게 쓰는 편지</Heading>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.purple[400]} size="large" />
            <Caption className="mt-4">편지를 쓰고 있어 …</Caption>
          </View>
        ) : (
          <>
            <View
              className="bg-surface rounded-2xl p-6"
              style={{ borderLeftWidth: 3, borderLeftColor: colors.purple[400] }}
              accessibilityRole="text"
              accessibilityLabel={`${label} 편지`}
            >
              <Text className="text-white text-base leading-loose">{letter}</Text>
            </View>

            {showReflectionCard && (
              <FirstVsLatestCard
                className="mt-6"
                questionText={LETTER_REFLECTION_TEXT}
                first={{ value: reflectionFirst.responseValue, dPlus: reflectionFirst.dPlus }}
                latest={{ value: reflectionLatest.responseValue, dPlus: reflectionLatest.dPlus }}
              />
            )}
          </>
        )}
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="나의 마지막 한 줄 쓰기"
          onPress={() => router.push('/graduation/farewell' as never)}
          disabled={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
