import { useEffect, useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MoodChart } from '@/components/ui/MoodChart';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { fetchRecentEntries } from '@/api/journal';

const DIRECTION_LABEL = { catch: '잡고 싶어', let_go: '보내고 싶어', undecided: '모르겠어' };

export default function GraduationReportScreen() {
  const { userId, daysElapsed } = useUserStore();
  const { entries, setEntries } = useJournalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchRecentEntries(userId, 30)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const moodScores = entries.slice(0, 7).map((e) => e.moodScore);
  const moodAvg = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : '—';

  const directionCounts = { catch: 0, let_go: 0, undecided: 0 };
  entries.forEach((e) => { directionCounts[e.direction]++; });
  const dominantDirection = (Object.entries(directionCounts).sort((a, b) => b[1] - a[1])[0][0]) as keyof typeof directionCounts;

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7F77DD" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-sm mb-2">졸업 · 1 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">이별 이후의 성장 리포트</Text>
        <Text className="text-gray-400 text-sm mb-8">D+{daysElapsed}일, 참 많이 걸어왔어.</Text>

        {/* 핵심 수치 */}
        <View className="flex-row gap-3 mb-6">
          <StatCard emoji="📔" label="일기" value={`${entries.length}개`} />
          <StatCard emoji="🌡️" label="평균 온도" value={`${moodAvg}°`} />
          <StatCard emoji="🧭" label="주된 방향" value={DIRECTION_LABEL[dominantDirection]} />
        </View>

        {/* 감정 추이 차트 */}
        <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#1A1A22' }}>
          <MoodChart moodScores={moodScores} label="최근 7일 감정 온도" />
        </View>

        <View className="p-4 rounded-2xl mb-6" style={{ backgroundColor: '#1A1A22' }}>
          <Text className="text-gray-400 text-sm leading-relaxed">
            {getReportSummary(entries.length, Number(moodAvg), daysElapsed)}
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="다음 — 나에게 쓰는 편지" onPress={() => router.push('/graduation/letter')} />
      </View>
    </ScreenWrapper>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl p-3 items-center" style={{ backgroundColor: '#1A1A22' }}>
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className="text-gray-400 text-xs mb-0.5">{label}</Text>
      <Text className="text-white text-sm font-semibold text-center">{value}</Text>
    </View>
  );
}

function getReportSummary(count: number, avg: number, days: number): string {
  if (count >= 20) return `${days}일 동안 ${count}번이나 마음을 기록했어. 그 성실함이 대단해. 감정을 외면하지 않고 마주한 거야.`;
  if (avg >= 7) return `평균 감정 온도가 높아. 힘든 시간 속에서도 조금씩 올라왔구나. 그 변화가 진짜야.`;
  if (days >= 60) return `${days}일이라는 긴 시간이 흘렀어. 많이 버텼어. 그게 가장 어려운 부분이었을 거야.`;
  return `이 기간 동안 솔직하게 자신과 마주했어. 그것만으로도 충분히 잘 한 거야.`;
}
