import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodChart } from '@/components/ui/MoodChart';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
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
      .catch((e) => console.warn('[graduation] status fetch failed:', e));
  }, [userId]);

  const moodScores = (stats?.moodTrend ?? entries.slice(0, 7).map((e) => e.moodScore));

  if (status === 'cooling') {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14 items-center justify-center">
          <View className="mb-4">
            <Icon name="hourglass" size={44} color={colors.gray[400]} strokeWidth={1.5} />
          </View>
          <Heading className="text-xl mb-2">유예 기간 중이야</Heading>
          <Body className="text-gray-400 text-center mb-8">
            졸업 전 7일 유예 기간이 진행 중이야.
          </Body>
          <PrimaryButton label="유예 대시보드 보기" onPress={() => router.push('/cooling')} />
        </View>
      </ScreenWrapper>
    );
  }

  if (status === 'confirmed') {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14 items-center justify-center">
          <View className="mb-4">
            <Icon name="graduation" size={64} color={colors.purple[400]} strokeWidth={1.5} />
          </View>
          <Display className="text-2xl mb-2 text-center">졸업했어</Display>
          <Body className="text-gray-400 text-center">
            이 시간을 통해 성장한 너를 진심으로 응원해.{'\n'}새로운 챕터를 잘 써내려가길 바랄게.
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  // mini 일기는 가벼운 기록이지만 꾸준한 자기관찰을 보여주므로,
  // 일반 일기 5개 조건을 mini 10개로 대체할 수 있게 한다.
  const fullEntries = entries.filter((e) => !e.isMiniMode);
  const miniEntries = entries.filter((e) => e.isMiniMode);
  const meetsJournalGate = fullEntries.length >= 5 || miniEntries.length >= 10;
  const canGraduate = daysElapsed >= 30 && meetsJournalGate;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">졸업 트랙</Caption>
        <Heading className="mb-2">
          {canGraduate ? '졸업 준비가 된 것 같아' : '아직 조금 더 걸어봐'}
        </Heading>
        <Caption className="mb-6">
          D+{daysElapsed}일 · 일기 {fullEntries.length}개
          {miniEntries.length > 0 ? ` · 미니 ${miniEntries.length}개` : ''}
        </Caption>

        {moodScores.length >= 2 && (
          <Card className="mb-6">
            <MoodChart moodScores={moodScores} label="최근 감정 추이" />
          </Card>
        )}

        {!canGraduate && (
          <View className="rounded-xl px-4 py-3 mb-6" style={{ backgroundColor: colors.overlayGrayStrong }}>
            <Body className="text-gray-400">
              졸업은 이별 후 30일 이상, 일기 5개 이상(또는 미니 일기 10개)을 채운 뒤 신청할 수 있어.{'\n'}
              지금은 감정을 충분히 느끼고 기록하는 게 먼저야.
            </Body>
          </View>
        )}

        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/graduation/report')}
            accessibilityRole="button"
            accessibilityLabel="성장 리포트 보기"
            accessibilityHint="이 기간 동안 걸어온 길"
            className="flex-row items-center p-4 rounded-2xl bg-surface active:opacity-70"
          >
            <View className="mr-3">
              <Icon name="chart" size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">성장 리포트 보기</Text>
              <Caption className="mt-0.5">이 기간 동안 걸어온 길</Caption>
            </View>
            <Icon name="chevron-right" size={18} color={colors.gray[600]} />
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
