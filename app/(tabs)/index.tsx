import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, Pressable, ScrollView, AppState } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { IntrusiveMemoryModal } from '@/components/IntrusiveMemoryModal';
import { EmotionalCheckModal } from '@/components/EmotionalCheckModal';
import { PersonaPriorityCard } from '@/components/PersonaPriorityCard';
import { ContactUrgeChip } from '@/components/ContactUrgeChip';
import { AssessmentRecommendationCard } from '@/components/AssessmentRecommendationCard';
import { usePersonaStore } from '@/store/usePersonaStore';
import { isMiniJournalFirst } from '@/constants/personaBranches';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { fetchDailyQuote } from '@/api/ai';
import { fetchRecentEntries, fetchTodayEntry } from '@/api/journal';
import { withRetry } from '@/utils/retry';
import { useEmotionalSafety } from '@/hooks/useEmotionalSafety';
import { useKnotTrigger } from '@/hooks/useKnotTrigger';
import { useCyclePromptTrigger } from '@/hooks/useCyclePromptTrigger';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';
import { trackEvent } from '@/api/telemetry';

export default function HomeScreen() {
  const { daysElapsed, userId, refreshDaysElapsed } = useUserStore();
  const { todayEntry, setTodayEntry, setEntries } = useJournalStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const personaSecondary = usePersonaStore(s => s.secondary);
  // C-2-G-3a: 회피형 페르소나면 일기 미니 모드를 primary 시각으로 강조 (매트릭스 §2 C3).
  const miniIsPrimary = isMiniJournalFirst(personaPrimary);
  const [dailyQuote, setDailyQuote] = useState<string>('');
  const [showIntrusiveModal, setShowIntrusiveModal] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<'consecutive_low' | 'late_night' | null>(null);
  const { checkConsecutiveLowTemperature, checkLateNightAccess } = useEmotionalSafety();

  useScreenView('home', { persona_category: anonymizePersona(personaPrimary) });
  useEffect(() => {
    if (miniIsPrimary) {
      trackEvent('persona_branch_applied', {
        screen: 'home',
        branch: 'mini_journal_first',
        persona_category: anonymizePersona(personaPrimary),
      });
    }
  }, [miniIsPrimary, personaPrimary]);

  // 새벽 접근 감지 — 홈 진입 시 1회
  useEffect(() => {
    checkLateNightAccess().then((result) => {
      if (result.triggered) setSafetyAlert('late_night');
    });
  }, []);

  // F-6 매듭 권유 트리거 — 6조건 AND 충족 시 풀스크린 모달 진입.
  // 비허용 페르소나/위기 신호/낮은 mood/쿨다운 등 어느 하나라도 실패면 미발화.
  // 모달이 mount되면 useKnotStore.recordPrompt가 lastTriggerCycle을 기록 → 같은 사이클
  // 재발화 차단. 거절 시 7일 쿨다운으로 재발화 차단.
  const knotTrigger = useKnotTrigger();
  useEffect(() => {
    if (knotTrigger.allowed) {
      router.push('/knot/prompt');
    }
  }, [knotTrigger.allowed]);

  // F-8 사이클 prompt — 매듭 *완료 후* 처음 홈 방문 시 1회 노출.
  // 새 매듭 권유 트리거(knotTrigger)와 *동시에 발화하지 않도록*: cycle prompt가 우선.
  const cyclePrompt = useCyclePromptTrigger();
  useEffect(() => {
    if (cyclePrompt.needed) {
      router.push('/knot/cycle-prompt');
    }
  }, [cyclePrompt.needed]);

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
        {/* G-3: D+N을 메인 헤딩으로 격상 — 이별 회복 앱의 핵심 컨텍스트.
            "reason · 그날 이후"는 컨텍스트 caption으로 위에 작게 배치. */}
        <View className="px-6 pt-14 pb-6">
          <Caption className="text-gray-500 mb-1">reason · 그날 이후</Caption>
          <View
            className="flex-row items-baseline gap-2"
            accessibilityRole="text"
            accessibilityLabel={`이별 후 ${daysElapsed}일 경과`}
          >
            <Heading className="text-purple-400">D+{daysElapsed}</Heading>
            <Caption className="text-gray-500">일째</Caption>
          </View>
          {/* DEV-ONLY: 페르소나 분류 결과 확인용 디버그 라벨. __DEV__ 가드로 production 자동 제거.
              사용자 노출 코드 아님 (개발자 검증용). 출시 전 제거 또는 디버그 패널로 이관. */}
          {__DEV__ && (
            <Caption className="text-amber-400 mt-2" style={{ fontSize: 11, fontFamily: 'monospace' }}>
              [DEV] persona: {personaPrimary ?? '—'}
              {personaSecondary ? ` · ${personaSecondary}` : ''}
            </Caption>
          )}
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
            // G-1: 일기 CTA 단일화. 페르소나별 *default 모드*만 primary 카드로 노출하고
            // 다른 모드는 작은 텍스트 링크로 격하 — 시각 경쟁자 1개로 집약.
            //
            // C-2-G-3a 페르소나 분기 보존: P02(회피형) 등 mini-first면 thermometer가 primary,
            // 그 외엔 깊게 쓰기가 primary.
            <View>
              <Pressable
                onPress={() => router.push(miniIsPrimary ? '/journal/mini' : '/journal')}
                accessibilityRole="button"
                accessibilityLabel={miniIsPrimary ? '오늘은 감정 온도만 기록' : '오늘 일기 쓰기'}
                accessibilityHint={
                  miniIsPrimary
                    ? '무기력한 날엔 감정 온도만 빠르게 기록해'
                    : '감정·방향·짧은 답변 4단계로 기록해'
                }
                className="rounded-2xl px-5 py-5 active:opacity-80"
                style={{ backgroundColor: colors.purple[600] }}
              >
                <View className="flex-row items-center gap-3">
                  <Icon
                    name={miniIsPrimary ? 'thermometer' : 'pen'}
                    size={24}
                    color={colors.white}
                  />
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {miniIsPrimary ? '오늘은 감정 온도만' : '오늘 일기 쓰기'}
                    </Text>
                    <Text className="text-purple-50 text-sm opacity-80 mt-0.5">
                      {miniIsPrimary ? '힘든 날엔 이만큼이면 돼' : '4단계로 차근차근 풀어볼게'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.white} />
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push(miniIsPrimary ? '/journal' : '/journal/mini')}
                accessibilityRole="button"
                accessibilityLabel={miniIsPrimary ? '깊게 쓰고 싶어' : '감정 온도만 빠르게'}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Caption className="text-center text-gray-500 py-3">
                  {miniIsPrimary ? '깊게 쓰고 싶어 →' : '감정 온도만 빠르게 →'}
                </Caption>
              </Pressable>
            </View>
          )}
        </View>

        {/* G-5: "갑자기 떠올랐어"는 돌발 상황 대응이라 *항상 접근 가능*해야 하지만,
            평상 시엔 시각 무게가 작아야 함. 큰 카드 → inline chip으로 격하. */}
        <View className="px-6 mb-6">
          <Pressable
            onPress={() => setShowIntrusiveModal(true)}
            accessibilityRole="button"
            accessibilityLabel="갑자기 떠올랐어"
            hitSlop={8}
            className="self-start rounded-full py-2 px-4 flex-row items-center gap-2 active:opacity-70"
            style={{ backgroundColor: colors.overlayPurpleSoft }}
          >
            <Icon name="fog" size={14} color={colors.purple[400]} />
            <Caption className="text-purple-400 font-semibold">갑자기 떠올랐어</Caption>
          </Pressable>
        </View>

        {/* G-6: 보조 카드 묶음.
            - AssessmentRecommendationCard: 조건부(D+7/14/30) — 권유 없으면 자체 null 반환
            - ContactUrgeChip: 매일 노출 (보고용 액션 카드)
            두 카드의 px·간격을 통일해 *하나의 묶음*으로 시각 인식되게. 매일 같은 자리에
            같은 종류가 있어야 학습이 됨 (Predictable layout). */}
        <View className="px-6 mb-6 gap-2">
          <AssessmentRecommendationCard />
          <ContactUrgeChip />
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
