import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, Pressable, ScrollView, AppState } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IntrusiveMemoryModal } from '@/components/IntrusiveMemoryModal';
import { EmotionalCheckModal } from '@/components/EmotionalCheckModal';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { fetchDailyQuote } from '@/api/ai';
import { fetchRecentEntries, fetchTodayEntry } from '@/api/journal';
import { withRetry } from '@/utils/retry';
import { useEmotionalSafety } from '@/hooks/useEmotionalSafety';

export default function HomeScreen() {
  const { daysElapsed, userId, refreshDaysElapsed } = useUserStore();
  const { todayEntry, setTodayEntry, setEntries } = useJournalStore();
  const [dailyQuote, setDailyQuote] = useState<string>('');
  const [showIntrusiveModal, setShowIntrusiveModal] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<'consecutive_low' | 'late_night' | null>(null);
  const { checkConsecutiveLowTemperature, checkLateNightAccess } = useEmotionalSafety();

  // 새벽 접근 감지 — 홈 진입 시 1회
  useEffect(() => {
    checkLateNightAccess().then((result) => {
      if (result.triggered) setSafetyAlert('late_night');
    });
  }, []);

  // 앱 포그라운드 진입 시마다 D+N 갱신
  useEffect(() => {
    refreshDaysElapsed();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDaysElapsed();
    });
    return () => sub.remove();
  }, []);

  // 오늘의 한마디 사전생성 — 홈 진입 시 미리 로드
  useEffect(() => {
    if (!userId) return;
    withRetry(() => fetchDailyQuote(daysElapsed, userId))
      .then(setDailyQuote)
      .catch(() => setDailyQuote('오늘도 한 걸음씩. 네 속도가 맞는 속도야.'));
  }, [userId, daysElapsed]);

  // 일기 동기화 — 홈 진입 시 오늘 엔트리/최근 30개를 서버에서 끌어와 store에 반영.
  // 앱 재시작이나 다른 기기에서 작성한 경우에도 history/홈 카드가 비지 않도록.
  useEffect(() => {
    if (!userId) return;
    fetchTodayEntry(userId)
      .then((entry) => {
        if (entry) setTodayEntry(entry);
      })
      .catch((e) => console.warn('[journal] fetchTodayEntry failed:', e));
    fetchRecentEntries(userId, 30)
      .then((entries) => {
        setEntries(entries);
        // 3일 연속 저온 체크 — entries 로드 완료 후 실행
        checkConsecutiveLowTemperature(userId).then((result) => {
          if (result.triggered) setSafetyAlert('consecutive_low');
        });
      })
      .catch((e) => console.warn('[journal] fetchRecentEntries failed:', e));
  }, [userId]);

  return (
    <ScreenWrapper>
      <IntrusiveMemoryModal
        visible={showIntrusiveModal}
        onClose={() => setShowIntrusiveModal(false)}
      />
      {safetyAlert && (
        <EmotionalCheckModal
          type={safetyAlert}
          visible={!!safetyAlert}
          onClose={() => setSafetyAlert(null)}
        />
      )}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <Heading>Reason - 그날 이후</Heading>
          <View
            className="bg-purple-800 rounded-full px-3 py-1"
            accessibilityRole="text"
            accessibilityLabel={`이별 후 ${daysElapsed}일 경과`}
          >
            <Text className="text-purple-400 text-sm font-semibold">D+{daysElapsed}</Text>
          </View>
        </View>

        {/* 오늘의 한마디 */}
        <View className="px-6 mb-5">
          <InsightCard
            tag="오늘의 한마디"
            body={
              dailyQuote ||
              todayEntry?.aiResponse ||
              '오늘 하루는 어땠어? 일기를 쓰면 조금 더 가까이 들을 수 있어.'
            }
            accent="purple"
          />
        </View>

        {/* 일기 CTA */}
        <View className="px-6 mb-6">
          {todayEntry ? (
            <Card variant="subtle" accent="teal" className="rounded-2xl p-4">
              <Text className="text-teal-400 text-sm font-medium mb-1">오늘 일기 작성 완료</Text>
              <Text className="text-white text-lg font-semibold">
                감정 온도 {todayEntry.moodScore}°
              </Text>
              <Caption className="mt-1">
                방향: {
                  todayEntry.direction === 'catch' ? '잡고 싶어'
                  : todayEntry.direction === 'let_go' ? '보내고 싶어'
                  : '아직 모르겠어'
                }
              </Caption>
            </Card>
          ) : (
            <View className="gap-3">
              <Pressable
                onPress={() => router.push('/journal/mini')}
                accessibilityRole="button"
                accessibilityLabel="오늘은 감정 온도만 기록"
                accessibilityHint="무기력한 날엔 감정 온도만 빠르게 기록해"
                className="rounded-2xl py-4 px-6 items-center flex-row justify-center gap-3 active:opacity-70 border border-gray-700"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-2xl">⚡</Text>
                <View>
                  <Text className="text-gray-200 font-semibold">오늘은 감정 온도만</Text>
                  <Caption className="text-gray-500">힘든 날엔 이만큼이면 돼</Caption>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/journal')}
                accessibilityRole="button"
                accessibilityLabel="깊게 쓰고 싶어"
                accessibilityHint="감정·방향·짧은 답변 4단계로 기록해"
                className="rounded-2xl py-5 px-6 items-center active:opacity-80"
                style={{ backgroundColor: colors.purple[600] }}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">🔥</Text>
                  <Text className="text-white text-lg font-bold">깊게 쓰고 싶어</Text>
                  <Icon name="chevron-right" color={colors.white} size={20} />
                </View>
                <Text className="text-purple-50 text-sm mt-1 opacity-80">
                  4단계로 차근차근 풀어볼게
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 갑자기 떠올랐어 버튼 */}
        <View className="px-6 mb-6">
          <Pressable
            onPress={() => setShowIntrusiveModal(true)}
            accessibilityRole="button"
            accessibilityLabel="갑자기 떠올랐어 — 30초 진정 플로우 시작"
            className="rounded-2xl py-4 px-6 items-center flex-row justify-center gap-3 active:opacity-70 border border-gray-700"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-2xl">🫧</Text>
            <View>
              <Text className="text-gray-200 font-semibold">지금 갑자기 떠올랐어</Text>
              <Caption className="text-gray-500">30초 진정 플로우</Caption>
            </View>
          </Pressable>
        </View>

        {/* 자기 성찰 트랙 (D+8 이상 강조) */}
        <View className="px-6 mb-6">
          <Pressable
            onPress={() => router.push('/about-me' as Href)}
            accessibilityRole="button"
            accessibilityLabel="나에 대해 알아가기"
            className="rounded-2xl py-4 px-6 items-center flex-row justify-center gap-3 active:opacity-70 border border-gray-700"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-2xl">🌱</Text>
            <View>
              <Text className="text-gray-200 font-semibold">나에 대해 알아가기</Text>
              <Caption className="text-gray-500">자존감 회복 트랙</Caption>
            </View>
          </Pressable>
        </View>

        {/* 하단 메뉴 카드들 */}
        <View className="px-6 gap-3">
          <QuickLink
            icon="search"
            title="관계 분석"
            desc="장단점, 이유, 가망 진단"
            onPress={() => router.push('/(tabs)/analysis')}
          />
          <QuickLink
            icon="compass"
            title="결정 나침반"
            desc="지금 마음의 방향 탐색"
            onPress={() => router.push('/(tabs)/compass')}
          />
          <QuickLink
            icon="book"
            title="일기 목록"
            desc="지나온 감정들 다시 보기"
            onPress={() => router.push('/journal/history')}
          />
          <QuickLink
            icon="heart"
            title="추억 돌아보기"
            desc="그 관계의 기억을 정리해봐"
            onPress={() => router.push('/memory' as Href)}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function QuickLink({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: IconName;
  title: string;
  desc: string;
  onPress: () => void;
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
        <Caption className="mt-0.5">{desc}</Caption>
      </View>
      <Icon name="chevron-right" size={18} color={colors.gray[600]} />
    </Pressable>
  );
}
