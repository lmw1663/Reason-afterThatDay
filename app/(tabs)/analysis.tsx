import { useEffect } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MeterBar } from '@/components/ui/MeterBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { calcDiagnosis } from '@/utils/diagnosis';
import { fetchRelationshipProfile } from '@/api/relationship';
import { disclaimer } from '@/constants/copy';

export default function AnalysisTabScreen() {
  const { profile, setProfile } = useRelationshipStore();
  const { stats } = useJournalStore();
  const { userId } = useUserStore();

  const hasData = profile.pros.length > 0 || profile.cons.length > 0 || profile.reasons.length > 0;

  useEffect(() => {
    if (!userId) return;
    fetchRelationshipProfile(userId)
      .then((p) => { if (p) setProfile(p); })
      .catch((e) => console.warn('[analysis] profile fetch failed:', e));
  }, [userId]);

  const moodAvg = stats?.moodTrend.length
    ? stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length
    : 5;
  const result = hasData ? calcDiagnosis(profile, moodAvg) : null;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">관계 분석</Caption>
        <Heading className="mb-6">우리 사이를 들여다볼게</Heading>

        {hasData && result ? (
          <>
            <Card variant="subtle" accent="purple" className="mb-6">
              <Caption className="text-purple-400 text-center">
                {disclaimer.cumulativeSummary}
              </Caption>
            </Card>

            <MeterBar label="재연결 가능성"    value={result.reconnect} color="purple" />
            <MeterBar label="문제 극복 가능성" value={result.fix}       color="teal"   />
            <MeterBar label="감정 회복도"      value={result.heal}      color="coral"  />

            <View className="mt-4 mb-6">
              <Text className="text-gray-600 text-xs text-center">
                헤어진 이유: {profile.reasons.join(', ')}
              </Text>
            </View>

            <PrimaryButton
              label="다시 분석하기"
              onPress={() => router.push('/analysis/reasons')}
              variant="ghost"
            />
          </>
        ) : (
          <View className="items-center py-12">
            <View className="mb-4">
              <Icon name="search" size={56} color={colors.gray[600]} strokeWidth={1.5} />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">아직 분석 데이터가 없어</Text>
            <Body className="text-gray-400 text-center mb-8">
              헤어진 이유, 장단점, 솔직한 점수를{'\n'}입력하면 가망 진단을 볼 수 있어.
            </Body>
            <PrimaryButton label="분석 시작하기" onPress={() => router.push('/analysis/reasons')} />
          </View>
        )}

        <View className="mt-6 gap-3">
          <AnalysisCard
            icon="pen"
            title="헤어진 이유"
            desc={profile.reasons.length > 0 ? profile.reasons.join(', ') : '아직 입력 안 했어'}
            onPress={() => router.push('/analysis/reasons')}
          />
          <AnalysisCard
            icon="scale"
            title="장단점"
            desc={`장점 ${profile.pros.length}개 · 단점 ${profile.cons.length}개`}
            onPress={() => router.push('/analysis/pros-cons')}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function AnalysisCard({ icon, title, desc, onPress }: {
  icon: IconName; title: string; desc: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} 화면으로 이동`}
      accessibilityHint={desc}
      className="flex-row items-center p-4 rounded-2xl bg-surface active:opacity-70"
    >
      <View className="mr-3">
        <Icon name={icon} size={22} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold">{title}</Text>
        <Caption className="mt-0.5" numberOfLines={1}>{desc}</Caption>
      </View>
      <Icon name="chevron-right" size={18} color={colors.gray[600]} />
    </Pressable>
  );
}
