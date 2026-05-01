import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MeterBar } from '@/components/ui/MeterBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { calcDiagnosis } from '@/utils/diagnosis';
import { upsertRelationshipProfile } from '@/api/relationship';
import { disclaimer } from '@/constants/copy';

export default function AnalysisResultScreen() {
  const { profile } = useRelationshipStore();
  const { stats } = useJournalStore();
  const { userId } = useUserStore();
  const [saving, setSaving] = useState(true);

  const moodAvg = stats?.moodTrend.length
    ? stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length
    : 5;

  const result = calcDiagnosis(profile, moodAvg);

  useEffect(() => {
    if (!userId) { setSaving(false); return; }
    upsertRelationshipProfile(userId, profile)
      .catch((e) => console.warn('[analysis] profile upsert failed:', e))
      .finally(() => setSaving(false));
  }, []);

  if (saving) {
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
        <Caption className="mb-2">관계 분석 · 4 / 4</Caption>
        <Heading className="mb-2">가망 진단 결과야</Heading>

        {/* 절대 규칙: "정답이 아니야" 문구 필수 */}
        <Card variant="subtle" accent="purple" className="mb-8">
          <Caption className="text-purple-400 text-center">
            {disclaimer.diagnosisResult}
          </Caption>
        </Card>

        <MeterBar
          label="재연결 가능성"
          value={result.reconnect}
          color="purple"
        />
        <MeterBar
          label="문제 극복 가능성"
          value={result.fix}
          color="teal"
        />
        <MeterBar
          label="감정 회복도"
          value={result.heal}
          color="coral"
        />

        <Card className="mt-6">
          <Body className="text-gray-400">{getSummary(result)}</Body>
        </Card>

        <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.overlayGrayMuted }}>
          <Caption variant="subtle" className="leading-relaxed">
            {disclaimer.meterReference}
          </Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <ProgressDots total={4} current={3} />
        <PrimaryButton
          label="나침반으로 방향 찾기"
          onPress={() => router.push('/compass')}
        />
        <PrimaryButton
          label="홈으로"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}

function getSummary({ reconnect, fix, heal }: { reconnect: number; fix: number; heal: number }) {
  if (reconnect > 0.6 && fix > 0.6) {
    return '잡고 싶은 마음이 꽤 강해 보이고, 문제를 풀 여지도 있어 보여. 그렇다고 꼭 그래야 한다는 건 아니야.';
  }
  if (heal > 0.6) {
    return '감정이 꽤 회복되고 있어. 어떤 선택을 하든 지금 이 흐름을 믿어봐도 좋을 것 같아.';
  }
  if (reconnect < 0.3 && fix < 0.3) {
    return '지금은 보내는 게 맞는 것 같다는 느낌이 드는 것 같아. 그것도 용기야.';
  }
  return '아직 마음이 정리되지 않은 것 같아. 그게 자연스러운 거야. 더 지켜봐도 괜찮아.';
}
