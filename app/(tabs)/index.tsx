import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, Pressable, ScrollView, AppState } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IntrusiveMemoryModal } from '@/components/IntrusiveMemoryModal';
import { EmotionalCheckModal } from '@/components/EmotionalCheckModal';
import { PersonaPriorityCard } from '@/components/PersonaPriorityCard';
import { usePersonaStore } from '@/store/usePersonaStore';
import { isMiniJournalFirst } from '@/constants/personaBranches';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { fetchDailyQuote } from '@/api/ai';
import { fetchRecentEntries, fetchTodayEntry } from '@/api/journal';
import { withRetry } from '@/utils/retry';
import { useEmotionalSafety } from '@/hooks/useEmotionalSafety';

export default function HomeScreen() {
  const { daysElapsed, userId, refreshDaysElapsed } = useUserStore();
  const { todayEntry, setTodayEntry, setEntries } = useJournalStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  // C-2-G-3a: 회피형 페르소나면 일기 미니 모드를 primary 시각으로 강조 (매트릭스 §2 C3).
  const miniIsPrimary = isMiniJournalFirst(personaPrimary);
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

        {/* 페르소나 우선 카드 슬롯 (A-6 + C-1-3 연결) — usePersonaStore의 primary가 null이면
            컴포넌트 자체가 null 반환 → wrapper도 렌더 X. */}
        <PersonaPriorityCard persona={personaPrimary} />

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
            <Pressable
              onPress={() => router.push('/journal/today')}
              accessibilityRole="button"
              accessibilityLabel="오늘 일기 이어쓰기 또는 수정하기"
              className="active:opacity-80 rounded-2xl p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  {/* 완료 배지 */}
                  <View
                    className="flex-row items-center self-start gap-1 rounded-full px-2 py-0.5 mb-2"
                    style={{ backgroundColor: colors.overlayPurpleSoft }}
                  >
                    <Icon name="check" size={11} color={colors.purple[400]} strokeWidth={2.5} />
                    <Caption style={{ color: colors.purple[400], fontSize: 11, fontWeight: '600' }}>
                      오늘 일기 작성 완료
                    </Caption>
                  </View>

                  {/* 감정 온도 */}
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-white text-2xl font-bold">{todayEntry.moodScore}</Text>
                    <Caption className="text-gray-500">/ 10</Caption>
                  </View>

                  <Caption className="text-gray-400 mt-1">
                    {
                      todayEntry.direction === 'catch' ? '잡고 싶어'
                      : todayEntry.direction === 'let_go' ? '보내고 싶어'
                      : '아직 모르겠어'
                    }
                  </Caption>
                </View>

                <View className="flex-row items-center gap-1">
                  <Caption className="text-gray-500">이어쓰기</Caption>
                  <Icon name="chevron-right" size={18} color={colors.gray[400]} />
                </View>
              </View>
            </Pressable>
          ) : (
            // C-2-G-3a: P02(회피형)면 미니 모드를 *primary*로 강조, 깊게 쓰기는 secondary.
            // 다른 페르소나는 baseline (깊게 쓰기 primary).
            <View className="gap-3">
              <Pressable
                onPress={() => router.push('/journal/mini')}
                accessibilityRole="button"
                accessibilityLabel="오늘은 감정 온도만 기록"
                accessibilityHint="무기력한 날엔 감정 온도만 빠르게 기록해"
                className="rounded-2xl px-6 items-center flex-row justify-center gap-3 active:opacity-80"
                style={{
                  backgroundColor: miniIsPrimary ? colors.purple[600] : colors.surface,
                  paddingVertical: miniIsPrimary ? 20 : 16,
                  borderWidth: miniIsPrimary ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Icon name="thermometer" size={24} color={miniIsPrimary ? colors.white : colors.gray[50]} />
                <View>
                  <Text className={`${miniIsPrimary ? 'text-white text-lg font-bold' : 'text-gray-200 font-semibold'}`}>
                    오늘은 감정 온도만
                  </Text>
                  <Caption className={miniIsPrimary ? 'text-purple-50 opacity-80' : 'text-gray-500'}>
                    힘든 날엔 이만큼이면 돼
                  </Caption>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/journal')}
                accessibilityRole="button"
                accessibilityLabel="깊게 쓰고 싶어"
                accessibilityHint="감정·방향·짧은 답변 4단계로 기록해"
                className="rounded-2xl px-6 items-center active:opacity-80"
                style={{
                  backgroundColor: miniIsPrimary ? colors.surface : colors.purple[600],
                  paddingVertical: miniIsPrimary ? 16 : 20,
                  borderWidth: miniIsPrimary ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Icon name="pen" size={22} color={miniIsPrimary ? colors.gray[50] : colors.white} />
                  <Text className={miniIsPrimary ? 'text-gray-200 font-semibold' : 'text-white text-lg font-bold'}>
                    깊게 쓰고 싶어
                  </Text>
                  <Icon name="chevron-right" color={miniIsPrimary ? colors.gray[400] : colors.white} size={20} />
                </View>
                <Text className={`text-sm mt-1 opacity-80 ${miniIsPrimary ? 'text-gray-500' : 'text-purple-50'}`}>
                  4단계로 차근차근 풀어볼게
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 빠른 진입 버튼 2개 (떠올랐어 / 나에 대해) */}
        <View className="px-6 mb-6 flex-row gap-3">
          <Pressable
            onPress={() => setShowIntrusiveModal(true)}
            accessibilityRole="button"
            accessibilityLabel="갑자기 떠올랐어"
            className="flex-1 rounded-2xl py-4 px-4 items-center active:opacity-70 border border-gray-700"
            style={{ backgroundColor: colors.surface }}
          >
            <Icon name="fog" size={26} color={colors.purple[400]} />
            <Text className="text-gray-200 font-semibold text-sm text-center mt-1">갑자기 떠올랐어</Text>
            <Caption className="text-gray-600 text-center text-xs mt-0.5">진정 플로우</Caption>
          </Pressable>

          <Pressable
            onPress={() => router.push('/about-me' as Href)}
            accessibilityRole="button"
            accessibilityLabel="나에 대해 알아가기"
            className="flex-1 rounded-2xl py-4 px-4 items-center active:opacity-70 border border-gray-700"
            style={{ backgroundColor: colors.surface }}
          >
            <Icon name="heart" size={26} color={colors.purple[400]} />
            <Text className="text-gray-200 font-semibold text-sm text-center mt-1">나에 대해</Text>
            <Caption className="text-gray-600 text-center text-xs mt-0.5">자존감 트랙</Caption>
          </Pressable>
        </View>

        {/* 메뉴 — 일기·추억은 [기록] 탭, 자기 통찰·분석·나침반은 [나] 탭에서 모아본다. */}
        {/* 홈은 *오늘 한 가지*에 집중 — A-3 재구성 후 단축키 최소화. */}
        <View className="px-6 gap-3">
          <QuickLink
            icon="book"
            title="기록 보기"
            desc="그동안 쌓인 일기·추억·회복의 흔적"
            onPress={() => router.push('/(tabs)/records' as Href)}
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
