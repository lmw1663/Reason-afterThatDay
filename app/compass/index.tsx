import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useDecisionStore } from '@/store/useDecisionStore';
import { VERDICT_LABEL } from '@/utils/diagnosis';

export default function CompassSummaryScreen() {
  const { daysElapsed } = useUserStore();
  const { stats, entries } = useJournalStore();
  const { latestVerdict } = useDecisionStore();

  const moodAvg = stats?.moodTrend.length
    ? (stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length).toFixed(1)
    : '—';

  const recentDirections = entries.slice(0, 7);
  const catchCount  = recentDirections.filter((e) => e.direction === 'catch').length;
  const letGoCount  = recentDirections.filter((e) => e.direction === 'let_go').length;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">결정 나침반</Caption>
        <Heading className="mb-2">지금까지의 여정을 먼저 볼게</Heading>
        <Body className="text-gray-400 mb-8">
          데이터를 바탕으로 방향을 탐색해 나갈 거야.
        </Body>

        <View className="gap-3 mb-6">
          <InsightCard
            tag={`D+${daysElapsed}`}
            body={`이별 후 ${daysElapsed}일째야. 이 시간 동안 많이 고민하고 느꼈을 거야.`}
            accent="purple"
          />
          <InsightCard
            tag="최근 7일 일기 방향"
            body={
              recentDirections.length === 0
                ? '아직 일기를 쓰지 않았어.'
                : `잡고 싶어 ${catchCount}회 · 보내고 싶어 ${letGoCount}회 · 모르겠어 ${recentDirections.length - catchCount - letGoCount}회`
            }
            accent="teal"
          />
          <InsightCard
            tag="평균 감정 온도"
            body={`최근 7일 평균 ${moodAvg}°`}
            accent="coral"
          />
          {latestVerdict && (
            <InsightCard
              tag="이전 나침반 결과"
              body={VERDICT_LABEL[latestVerdict]}
              accent="purple"
            />
          )}
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="탐색 시작하기" onPress={() => router.push('/compass/want')} />
      </View>
    </ScreenWrapper>
  );
}
