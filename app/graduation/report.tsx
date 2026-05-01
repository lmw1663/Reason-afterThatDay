import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MoodChart } from '@/components/ui/MoodChart';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { fetchRecentEntries } from '@/api/journal';
import { analyzeMoodTrend } from '@/utils/moodAnalysis';

const DIRECTION_LABEL: Record<Direction, string> = { catch: '잡고 싶어', let_go: '보내고 싶어', undecided: '모르겠어' };
const DIRECTION_COLOR: Record<Direction, string> = { catch: colors.purple[400], let_go: colors.teal[400], undecided: colors.gray[400] };
const DIRECTION_DOT: Record<Direction, string> = { catch: '💜', let_go: '🩵', undecided: '⚫' };

export default function GraduationReportScreen() {
  const { userId, daysElapsed } = useUserStore();
  const { entries, setEntries } = useJournalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchRecentEntries(userId, 30)
      .then(setEntries)
      .catch((e) => console.warn('[graduation] fetchRecentEntries failed:', e))
      .finally(() => setLoading(false));
  }, [userId]);

  const moodScores = entries.slice(0, 7).map((e) => e.moodScore);
  const moodAvg = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : '—';
  const moodInsight = analyzeMoodTrend(moodScores);

  const directionCounts = { catch: 0, let_go: 0, undecided: 0 };
  entries.forEach((e) => { directionCounts[e.direction]++; });
  const dominantDirection = (Object.entries(directionCounts).sort((a, b) => b[1] - a[1])[0][0]) as Direction;

  // 방향 변화 타임라인 — 인접 중복 제거해 변화 시점만 추출
  const timeline: { direction: Direction; date: string }[] = [];
  const chronological = [...entries].reverse();
  for (const entry of chronological) {
    if (timeline.length === 0 || timeline[timeline.length - 1].direction !== entry.direction) {
      timeline.push({ direction: entry.direction, date: entry.createdAt.slice(0, 10) });
    }
  }
  const switchCount = Math.max(0, timeline.length - 1);

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.purple[400]} />
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
        <Caption className="mb-2">졸업 · 1 / 5</Caption>
        <Heading className="mb-2">이별 이후의 성장 리포트</Heading>
        <Caption className="mb-8">D+{daysElapsed}일, 참 많이 걸어왔어.</Caption>

        {/* 핵심 수치 */}
        <View className="flex-row gap-3 mb-6">
          <StatCard icon="book"        label="일기"      value={`${entries.length}개`} />
          <StatCard icon="thermometer" label="평균 온도" value={`${moodAvg}°`} />
          <StatCard icon="compass"     label="주된 방향" value={DIRECTION_LABEL[dominantDirection]} />
        </View>

        {/* 감정 추이 차트 */}
        <Card className="mb-6">
          <MoodChart moodScores={moodScores} label="최근 7일 감정 온도" />
        </Card>

        <Card className="mb-6">
          <Body className="text-gray-400">
            {getReportSummary(entries.length, Number(moodAvg), daysElapsed)}
          </Body>
        </Card>

        {moodInsight.trend !== 'insufficient' && (
          <Card variant="subtle" accent="teal" className="mb-6">
            <Caption className="text-teal-400 mb-1">감정 흐름</Caption>
            <Body className="text-gray-300">{moodInsight.sentence}</Body>
          </Card>
        )}

        {timeline.length > 1 && (
          <Card className="mb-6">
            <Caption className="text-gray-500 mb-4">
              방향 변화 타임라인 — 총 {switchCount}번 바뀌었어
            </Caption>
            <View style={{ gap: 8 }}>
              {timeline.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: DIRECTION_COLOR[item.direction],
                    }}
                  />
                  <Text style={{ color: DIRECTION_COLOR[item.direction], fontSize: 13, fontWeight: '600' }}>
                    {DIRECTION_LABEL[item.direction]}
                  </Text>
                  <Text style={{ color: colors.gray[600], fontSize: 12 }}>{item.date}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="다음 — 나에게 쓰는 편지" onPress={() => router.push('/graduation/letter')} />
      </View>
    </ScreenWrapper>
  );
}

function StatCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View
      className="flex-1 rounded-2xl p-3 items-center bg-surface"
      accessibilityRole="text"
      accessibilityLabel={`${label} ${value}`}
    >
      <View className="mb-1">
        <Icon name={icon} size={20} />
      </View>
      <Caption variant="subtle" className="mb-0.5">{label}</Caption>
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
