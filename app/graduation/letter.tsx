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
import { useQuestionStore } from '@/store/useQuestionStore';
import { fetchResponseHistoryByCategory, type ResponseHistoryEntry } from '@/api/questions';
import { FirstVsLatestCard } from '@/components/ui/FirstVsLatestCard';
import { pickReasonReflection } from '@/utils/reasonReflection';

// Phase H — 졸업 편지의 회상 카드는 'reason' 카테고리 안에서 *가장 최근까지 변화가 있는*
// 질문을 자동 선택. 현재 시드는 a_breakup_reason 단일이지만, 향후 reason 카테고리에 다른
// 질문이 추가돼도 코드 변경 없이 가장 활동적인 변화를 노출.
//
// Phase K-1 결정 — letter 는 *FirstVsLatestCard* (처음↔지금 2점 비교) 유지.
// graduation/report·knot/archive 는 *AnswerTimeline* (전체 시계열). 의도적 차이:
//   · letter 는 emotional final reflection — 2점 비교가 시 같은 호흡으로 더 적합
//   · report·archive 는 회복 서사 분석 — 전체 흐름이 정보 가치 큼
// 톤 정합은 두 컴포넌트 공유 formatter (`defaultPreviousAnswerFormatter`) 와
// "변화 횟수 미표시" 정책으로 보장. 시각 형태만 의도적으로 다름.
const REFLECTION_CATEGORY = 'reason' as const;

// 사용자에게 보여줄 카드 라벨 — 질문 풀에서 텍스트 가져오면 정확하지만, 풀 미로드 대비 폴백.
const REFLECTION_TEXT_FALLBACK = '처음에 적었던 헤어진 이유';

export default function GraduationLetterScreen() {
  const { userId, daysElapsed } = useUserStore();
  const { entries, stats } = useJournalStore();
  const { profile } = useRelationshipStore();
  const { checkinResponses } = useCoolingStore();
  const { label } = useKnotPolicy();
  // Phase G — 진입 후 C-SSRS 잠금 발생(예: cooling 중 위기 신호)으로 매듭 트랙이
  // 닫혔을 경우 letter 화면도 즉시 redirect. fail-open(서버 장애 시 unlocked).
  const lockState = useGraduationLockGuard();
  const pool = useQuestionStore((s) => s.pool);
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState<ReturnType<typeof pickReasonReflection>>(null);

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

  // 풀에서 회상 질문의 텍스트 — 미로드 시 폴백
  const reflectionText = reflection
    ? pool.find((q) => q.id === reflection.questionId)?.text ?? REFLECTION_TEXT_FALLBACK
    : REFLECTION_TEXT_FALLBACK;

  // Phase H — reason 카테고리 전체에서 가장 활동적인 변화 자동 선택.
  // 잠금/unlocked 확인 후 카테고리 history 와 letter 를 직렬 fetch.
  useEffect(() => {
    if (lockState !== 'unlocked' || !userId) return;
    let cancelled = false;

    fetchResponseHistoryByCategory(userId, REFLECTION_CATEGORY)
      .catch(() => [] as ResponseHistoryEntry[])
      .then((history) => {
        if (cancelled) return null;
        const picked = pickReasonReflection(history);
        setReflection(picked);
        return picked;
      })
      .then((picked) => {
        if (cancelled) return;
        return fetchGraduationLetter({
          daysElapsed,
          moodAvg,
          reasons: profile.reasons,
          pros: profile.pros,
          cons: profile.cons,
          journalCount: entries.length,
          checkinMoods,
          checkinNotes,
          reasonReflection: picked
            ? {
                first: { value: picked.first.responseValue, dPlus: picked.first.dPlus },
                latest: { value: picked.latest.responseValue, dPlus: picked.latest.dPlus },
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

            {reflection && (
              <FirstVsLatestCard
                className="mt-6"
                questionText={reflectionText}
                first={{ value: reflection.first.responseValue, dPlus: reflection.first.dPlus }}
                latest={{ value: reflection.latest.responseValue, dPlus: reflection.latest.dPlus }}
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
