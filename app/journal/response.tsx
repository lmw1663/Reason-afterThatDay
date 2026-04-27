import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
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
  const { entries, setTodayEntry } = useJournalStore();
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

  // 스트리밍 완료 후 DB 저장
  useEffect(() => {
    if (!done || !text || !userId) return;
    upsertJournalEntry({
      userId,
      moodScore: score,
      moodLabel: tags,
      direction,
      freeText: params.freeText || undefined,
      aiResponse: text,
    })
      .then(setTodayEntry)
      .catch(() => {});
  }, [done]);

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">이별 일기 · 4 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-8">오늘 기록 완료 🌙</Text>

        {loading && !text ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#7F77DD" size="large" />
            <Text className="text-gray-400 text-sm mt-4">잠깐, 들어볼게 …</Text>
          </View>
        ) : (
          <InsightCard tag="오늘의 한마디" body={text} accent="purple" />
        )}

        <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: '#1A1A22' }}>
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">감정 온도</Text>
            <Text className="text-white font-semibold">{score}°</Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400 text-sm">방향</Text>
            <Text className="text-purple-400 font-semibold">
              {direction === 'catch' ? '잡고 싶어' : direction === 'let_go' ? '보내고 싶어' : '모르겠어'}
            </Text>
          </View>
        </View>
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
