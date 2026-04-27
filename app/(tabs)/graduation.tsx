import { useEffect } from 'react';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodChart } from '@/components/ui/MoodChart';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { fetchGraduationStatus } from '@/api/graduation';

export default function GraduationTabScreen() {
  const { userId, daysElapsed } = useUserStore();
  const { entries, stats } = useJournalStore();
  const { status, setCooling } = useCoolingStore();

  useEffect(() => {
    if (!userId) return;
    fetchGraduationStatus(userId)
      .then((row) => {
        if (row) setCooling(row);
      })
      .catch(() => {});
  }, [userId]);

  const moodScores = (stats?.moodTrend ?? entries.slice(0, 7).map((e) => e.moodScore));

  if (status === 'cooling') {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14 items-center justify-center">
          <Text className="text-4xl mb-4">⏳</Text>
          <Text className="text-white text-xl font-bold mb-2">유예 기간 중이야</Text>
          <Text className="text-gray-400 text-sm text-center mb-8">
            졸업 전 7일 유예 기간이 진행 중이야.
          </Text>
          <PrimaryButton label="유예 대시보드 보기" onPress={() => router.push('/cooling')} />
        </View>
      </ScreenWrapper>
    );
  }

  if (status === 'confirmed') {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14 items-center justify-center">
          <Text className="text-6xl mb-4">🎓</Text>
          <Text className="text-white text-2xl font-bold mb-2 text-center">졸업했어</Text>
          <Text className="text-gray-400 text-sm text-center leading-relaxed">
            이 시간을 통해 성장한 너를 진심으로 응원해.{'\n'}새로운 챕터를 잘 써내려가길 바랄게.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const canGraduate = daysElapsed >= 30 && entries.length >= 5;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-sm mb-2">졸업 트랙</Text>
        <Text className="text-white text-2xl font-bold mb-2">
          {canGraduate ? '졸업 준비가 된 것 같아' : '아직 조금 더 걸어봐'}
        </Text>
        <Text className="text-gray-400 text-sm mb-6">
          D+{daysElapsed}일 · 일기 {entries.length}개
        </Text>

        {moodScores.length >= 2 && (
          <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#1A1A22' }}>
            <MoodChart moodScores={moodScores} label="최근 감정 추이" />
          </View>
        )}

        {!canGraduate && (
          <View className="rounded-xl px-4 py-3 mb-6" style={{ backgroundColor: 'rgba(68,68,65,0.4)' }}>
            <Text className="text-gray-400 text-sm leading-relaxed">
              졸업은 이별 후 30일 이상, 일기 5개 이상 작성 후 신청할 수 있어.{'\n'}
              지금은 감정을 충분히 느끼고 기록하는 게 먼저야.
            </Text>
          </View>
        )}

        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/graduation/report')}
            className="flex-row items-center p-4 rounded-2xl active:opacity-70"
            style={{ backgroundColor: '#1A1A22' }}
          >
            <Text className="text-2xl mr-3">📊</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold">성장 리포트 보기</Text>
              <Text className="text-gray-400 text-sm mt-0.5">이 기간 동안 걸어온 길</Text>
            </View>
            <Text className="text-gray-600">›</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label={canGraduate ? '졸업 신청하기' : '성장 리포트 먼저 보기'}
          onPress={() => router.push(canGraduate ? '/graduation/report' : '/graduation/report')}
          disabled={!canGraduate && entries.length === 0}
        />
      </View>
    </ScreenWrapper>
  );
}
