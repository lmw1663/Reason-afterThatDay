import { useEffect } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MeterBar } from '@/components/ui/MeterBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { calcDiagnosis } from '@/utils/diagnosis';
import { fetchRelationshipProfile } from '@/api/relationship';

export default function AnalysisTabScreen() {
  const { profile, setProfile } = useRelationshipStore();
  const { stats } = useJournalStore();
  const { userId } = useUserStore();

  const hasData = profile.pros.length > 0 || profile.cons.length > 0 || profile.reasons.length > 0;

  useEffect(() => {
    if (!userId) return;
    fetchRelationshipProfile(userId)
      .then((p) => { if (p) setProfile(p); })
      .catch(() => {});
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
        <Text className="text-gray-400 text-sm mb-2">관계 분석</Text>
        <Text className="text-white text-2xl font-bold mb-6">
          우리 사이를 들여다볼게
        </Text>

        {hasData && result ? (
          <>
            <View
              className="rounded-xl px-4 py-3 mb-6"
              style={{ backgroundColor: 'rgba(127,119,221,0.1)', borderWidth: 1, borderColor: '#534AB7' }}
            >
              <Text className="text-purple-400 text-sm text-center">
                이건 정답이 아니야. 지금 이 순간의 경향일 뿐이야.
              </Text>
            </View>

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
              onPress={() => router.push('/analysis')}
              variant="ghost"
            />
          </>
        ) : (
          <View className="items-center py-12">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-white text-lg font-semibold mb-2">아직 분석 데이터가 없어</Text>
            <Text className="text-gray-400 text-sm text-center mb-8">
              헤어진 이유, 장단점, 솔직한 점수를{'\n'}입력하면 가망 진단을 볼 수 있어.
            </Text>
            <PrimaryButton label="분석 시작하기" onPress={() => router.push('/analysis')} />
          </View>
        )}

        <View className="mt-6 gap-3">
          <AnalysisCard
            emoji="📝"
            title="헤어진 이유"
            desc={profile.reasons.length > 0 ? profile.reasons.join(', ') : '아직 입력 안 했어'}
            onPress={() => router.push('/analysis')}
          />
          <AnalysisCard
            emoji="⚖️"
            title="장단점"
            desc={`장점 ${profile.pros.length}개 · 단점 ${profile.cons.length}개`}
            onPress={() => router.push('/analysis/pros-cons')}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function AnalysisCard({ emoji, title, desc, onPress }: {
  emoji: string; title: string; desc: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1A22' }}
    >
      <Text className="text-2xl mr-3">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold">{title}</Text>
        <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>{desc}</Text>
      </View>
      <Text className="text-gray-600">›</Text>
    </Pressable>
  );
}
