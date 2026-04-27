import { useEffect, useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { MeterBar } from '@/components/ui/MeterBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { calcDiagnosis } from '@/utils/diagnosis';
import { upsertRelationshipProfile } from '@/api/relationship';

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
      .catch(() => {})
      .finally(() => setSaving(false));
  }, []);

  if (saving) {
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
        <Text className="text-gray-400 text-sm mb-2">관계 분석 · 4 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">가망 진단 결과야</Text>

        {/* 절대 규칙: "정답이 아니야" 문구 필수 */}
        <View
          className="rounded-xl px-4 py-3 mb-8"
          style={{ backgroundColor: 'rgba(127,119,221,0.1)', borderWidth: 1, borderColor: '#534AB7' }}
        >
          <Text className="text-purple-400 text-sm text-center">
            이건 정답이 아니야. 지금 이 순간의 경향일 뿐이야.
          </Text>
        </View>

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

        <View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: '#1A1A22' }}>
          <Text className="text-gray-400 text-sm leading-relaxed">
            {getSummary(result)}
          </Text>
        </View>

        <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(68,68,65,0.3)' }}>
          <Text className="text-gray-600 text-xs leading-relaxed">
            이 수치는 지금까지 네가 입력한 내용을 바탕으로 한 참고용 지표야.{'\n'}
            사람 마음은 수치로 다 담을 수 없어. 방향 변화에 따라 달라질 수 있어.
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
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
