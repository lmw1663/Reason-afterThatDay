import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { fetchJournalResponse } from '@/api/ai';
import { upsertJournalEntry } from '@/api/journal';

export default function JournalResponseScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    freeText: string;
    direction: string;
    questionAnswer: string;
  }>();

  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { userId, daysElapsed } = useUserStore();
  const { entries, setTodayEntry } = useJournalStore();

  const score = Number(params.score ?? '5');
  const direction = (params.direction ?? 'undecided') as Direction;
  const tags = params.tags ? params.tags.split(',') : [];
  const recentMoods = entries.slice(0, 3).map((e) => e.moodScore);

  useEffect(() => {
    (async () => {
      try {
        const aiResponse = await fetchJournalResponse({
          moodScore: score,
          direction,
          freeText: params.freeText || params.questionAnswer || undefined,
          recentMoods,
          daysElapsed,
        });
        setResponse(aiResponse);

        if (userId) {
          const entry = await upsertJournalEntry({
            userId,
            moodScore: score,
            moodLabel: tags,
            direction,
            freeText: params.freeText || undefined,
            aiResponse,
          });
          setTodayEntry(entry);
        }
      } catch {
        setResponse('지금 잠깐 연결이 안 됐어. 그래도 오늘 기록은 잘 저장됐어.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">이별 일기 · 4 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-8">
          오늘 기록 완료 🌙
        </Text>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#7F77DD" size="large" />
            <Text className="text-gray-400 text-sm mt-4">잠깐, 들어볼게 …</Text>
          </View>
        ) : (
          <InsightCard
            tag="오늘의 한마디"
            body={response ?? ''}
            accent="purple"
          />
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
        <PrimaryButton label="홈으로" onPress={() => router.replace('/(tabs)')} />
      </View>
    </ScreenWrapper>
  );
}
