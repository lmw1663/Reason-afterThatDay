import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import { View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { useStreamingJournalResponse } from '@/hooks/useStreamingAI';
import { upsertJournalEntry } from '@/api/journal';

export default function JournalResponseScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    freeText: string;
    direction: string;
    questionAnswer: string;
  }>();

  const { userId, daysElapsed } = useUserStore();
  const { entries, upsertEntry } = useJournalStore();
  const { text, loading, done, fetchStream } = useStreamingJournalResponse();

  const score = Number(params.score ?? '5');
  const direction = (params.direction ?? 'undecided') as Direction;
  const tags = params.tags ? params.tags.split(',').filter(Boolean) : [];
  const recentMoods = entries.slice(0, 3).map((e) => e.moodScore);

  useEffect(() => {
    const ctx = {
      moodScore: score,
      direction,
      freeText: params.freeText || params.questionAnswer || undefined,
      recentMoods,
      daysElapsed,
    };

    fetchStream(ctx);
  }, []);

  // 스트리밍 완료 후 로컬 즉시 반영 + DB 저장
  // 1) userId 유무와 상관없이 로컬 entries 에 먼저 prepend → history에 즉시 보이게.
  // 2) userId 가 있으면 DB 저장 후 서버 응답(id/createdAt) 으로 로컬 엔트리 교체.
  useEffect(() => {
    if (!done || !text) return;

    const localEntry = {
      id: `local-${Date.now()}`,
      userId: userId ?? 'local',
      createdAt: new Date().toISOString(),
      moodScore: score,
      moodLabel: tags,
      direction,
      freeText: params.freeText || undefined,
      aiResponse: text,
    };
    upsertEntry(localEntry);

    if (!userId) return;

    upsertJournalEntry({
      userId,
      moodScore: score,
      moodLabel: tags,
      direction,
      freeText: params.freeText || undefined,
      aiResponse: text,
    })
      .then((saved) => upsertEntry(saved))
      .catch((e) => {
        const err = e as { code?: string; message?: string };
        console.warn('[journal] save failed:', err.code ?? err.message ?? e);
      });
  }, [done]);

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">이별 일기 · 4 / 4</Caption>
        <View className="flex-row items-center gap-2 mb-8">
          <Heading>오늘 기록 완료</Heading>
          <Icon name="moon" size={22} color={colors.purple[400]} />
        </View>

        {loading && !text ? (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.purple[400]} size="large" />
            <Caption className="mt-4">잠깐, 들어볼게 …</Caption>
          </View>
        ) : (
          <InsightCard tag="오늘의 한마디" body={text} accent="purple" />
        )}

        <Card className="mt-6">
          <View className="flex-row justify-between">
            <Caption>감정 온도</Caption>
            <Body className="text-white font-semibold">{score}°</Body>
          </View>
          <View className="flex-row justify-between mt-2">
            <Caption>방향</Caption>
            <Body className="text-purple-400 font-semibold">
              {direction === 'catch' ? '잡고 싶어' : direction === 'let_go' ? '보내고 싶어' : '모르겠어'}
            </Body>
          </View>
        </Card>
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={3} />
        <PrimaryButton
          label="홈으로"
          onPress={() => router.replace('/(tabs)')}
          disabled={!done && !text}
        />
      </View>
    </ScreenWrapper>
  );
}
