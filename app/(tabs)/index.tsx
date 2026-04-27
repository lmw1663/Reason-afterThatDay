import { useEffect } from 'react';
import { Text, View, Pressable, ScrollView, AppState } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';

export default function HomeScreen() {
  const { daysElapsed, refreshDaysElapsed } = useUserStore();
  const { todayEntry } = useJournalStore();

  // 앱 포그라운드 진입 시마다 D+N 갱신
  useEffect(() => {
    refreshDaysElapsed();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDaysElapsed();
    });
    return () => sub.remove();
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <Text className="text-white text-2xl font-bold">reason</Text>
          <View className="bg-purple-800 rounded-full px-3 py-1">
            <Text className="text-purple-400 text-sm font-semibold">D+{daysElapsed}</Text>
          </View>
        </View>

        {/* 오늘의 한마디 */}
        <View className="px-6 mb-5">
          <InsightCard
            tag="오늘의 한마디"
            body={
              todayEntry?.aiResponse ??
              '오늘 하루는 어땠어? 일기를 쓰면 조금 더 가까이 들을 수 있어.'
            }
            accent="purple"
          />
        </View>

        {/* 일기 CTA */}
        <View className="px-6 mb-6">
          {todayEntry ? (
            <View
              className="rounded-2xl p-4 border border-teal-600"
              style={{ backgroundColor: 'rgba(15,110,86,0.1)' }}
            >
              <Text className="text-teal-400 text-sm font-medium mb-1">오늘 일기 작성 완료</Text>
              <Text className="text-white text-lg font-semibold">
                감정 온도 {todayEntry.moodScore}°
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                방향: {
                  todayEntry.direction === 'catch' ? '잡고 싶어'
                  : todayEntry.direction === 'let_go' ? '보내고 싶어'
                  : '아직 모르겠어'
                }
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/journal')}
              className="rounded-2xl py-5 px-6 items-center active:opacity-80"
              style={{ backgroundColor: '#534AB7' }}
            >
              <Text className="text-white text-lg font-bold">오늘 일기 쓰기 ▶</Text>
              <Text className="text-purple-50 text-sm mt-1 opacity-80">
                지금 마음을 기록해둘게
              </Text>
            </Pressable>
          )}
        </View>

        {/* 하단 메뉴 카드들 */}
        <View className="px-6 gap-3">
          <QuickLink
            emoji="🔍"
            title="관계 분석"
            desc="장단점, 이유, 가망 진단"
            onPress={() => router.push('/(tabs)/analysis')}
          />
          <QuickLink
            emoji="🧭"
            title="결정 나침반"
            desc="지금 마음의 방향 탐색"
            onPress={() => router.push('/(tabs)/compass')}
          />
          <QuickLink
            emoji="📔"
            title="일기 목록"
            desc="지나온 감정들 다시 보기"
            onPress={() => router.push('/journal/history')}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function QuickLink({
  emoji,
  title,
  desc,
  onPress,
}: {
  emoji: string;
  title: string;
  desc: string;
  onPress: () => void;
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
        <Text className="text-gray-400 text-sm mt-0.5">{desc}</Text>
      </View>
      <Text className="text-gray-600">›</Text>
    </Pressable>
  );
}
