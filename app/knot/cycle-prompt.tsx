import { useCallback, useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/useUserStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useKnotStore } from '@/store/useKnotStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useKnotPolicy } from '@/hooks/useKnotPolicy';
import { useGraduationLockGuard } from '@/hooks/useGraduationLockGuard';
import { advanceRelationshipCycle, saveKnotArchive } from '@/api/knotArchive';
import { buildArchiveSnapshot } from '@/utils/knotCycle';

/**
 * 매듭 사이클 가역성 prompt — F-8
 *
 * 매듭 완료 후 사용자가 처음 홈에 들어올 때 1회만 노출. 두 선택:
 *   - "다시 시작할래"  → cycleCount++, lastKnotAt 갱신, 이전 사이클은 archive로 보존
 *   - "이어 쓸래"      → 그대로 진행. 이전 사이클의 일기·기록을 같은 cycle로 계속.
 *
 * 가역성 H1: 새 사이클 시작이 *재발/실패*가 아닌 *사이클의 한 챕터*임을 명시. 비낙인 어휘.
 *
 * markCyclePromptShown는 두 응답 모두에서 호출 → 같은 매듭에 대해 재발화 차단.
 *
 * **canEnterKnotTrack 미적용 의도**: 본 화면은 *새 매듭 권유*가 아니라 *일기 사이클 분리*다.
 * 이미 매듭을 경험한 사용자가 일기를 다시 쓰는 것은 가역성 H1의 본질 — P19(ROCD)·P03·P11
 * 등 비허용 페르소나라도 *일기 작성 자체*는 막을 수 없다. 권유 모달(prompt.tsx)과 다른
 * 책임 영역. 따라서 본 화면은 페르소나 권유 게이트를 의도적으로 건너뛴다.
 *
 * **F-12 P1-C 위기 lockout 가드**: 가역성 H1은 *비낙인* 의미이지 *위기 무시*가 아니다.
 * C-SSRS 양성 사용자가 새 사이클을 시작하면 자해 충동·폭발성 위험 — graduationLocked 시
 * 즉시 / 로 reroute하여 위기 자원 화면이 우선되도록 한다. (페르소나 게이트는 미적용 유지)
 */
export default function KnotCyclePromptScreen() {
  const { daysElapsed } = useUserStore();
  const { label, coolingDays } = useKnotPolicy();
  const userId = useUserStore((s) => s.userId);
  const lastKnotAt = useRelationshipStore((s) => s.profile.lastKnotAt);
  const cycleCount = useRelationshipStore((s) => s.profile.cycleCount);
  const startNewCycle = useRelationshipStore((s) => s.startNewCycle);
  const markCyclePromptShown = useKnotStore((s) => s.markCyclePromptShown);
  const hideKnotTab = useKnotStore((s) => s.hideKnotTab);
  const coolingPeriodId = useCoolingStore((s) => s.id);
  const entries = useJournalStore((s) => s.entries);
  const personaPrimary = usePersonaStore((s) => s.primary);
  const personaSecondary = usePersonaStore((s) => s.secondary);
  const graduationLock = useGraduationLockGuard();

  // F-12 P1-C: 위기 lockout 시 즉시 차단 — 가역성 H1보다 안전 우선
  useEffect(() => {
    if (graduationLock === 'locked') {
      router.replace('/');
    }
  }, [graduationLock]);

  const handleNewCycle = useCallback(async () => {
    if (lastKnotAt) markCyclePromptShown(lastKnotAt);
    // 1. archive INSERT — *종료 cycle*의 스냅샷을 cycle_index=현재값으로 보존 (가역성 H1)
    if (userId && coolingPeriodId && lastKnotAt) {
      const personaCodes = [personaPrimary, personaSecondary].filter(
        (p): p is NonNullable<typeof p> => p !== null,
      );
      try {
        await saveKnotArchive({
          userId,
          coolingPeriodId,
          snapshot: buildArchiveSnapshot({
            cycleIndex: cycleCount,
            knotLabel: label,
            entries,
            personaCodes,
            coolingDays,
            lastKnotAt,
          }),
        });
      } catch (e) {
        console.warn('[knot-cycle] saveKnotArchive failed:', e);
      }
    }

    // 2. relationship_profile DB 갱신 (cycle_count++, last_knot_at·label)
    if (userId) {
      const now = new Date().toISOString();
      try {
        await advanceRelationshipCycle({
          userId,
          newCycleCount: cycleCount + 1,
          lastKnotAt: now,
          lastKnotLabel: label,
        });
      } catch (e) {
        console.warn('[knot-cycle] advanceRelationshipCycle failed:', e);
      }
    }

    // 3. store 동기화 (cycleCount++ + lastKnotAt 갱신) + 매듭 탭 숨김
    startNewCycle();
    hideKnotTab();
    router.replace('/');
  }, [lastKnotAt, markCyclePromptShown, startNewCycle, hideKnotTab, userId, cycleCount, label, coolingPeriodId, entries, personaPrimary, personaSecondary, coolingDays]);

  const handleContinue = useCallback(() => {
    if (lastKnotAt) markCyclePromptShown(lastKnotAt);
    router.replace('/');
  }, [lastKnotAt, markCyclePromptShown]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleContinue();
      return true;
    });
    return () => sub.remove();
  }, [handleContinue]);

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">D+{daysElapsed}</Caption>
        <Heading className="mb-6">다시 일기를 쓰러 왔구나</Heading>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Body className="text-gray-100 leading-relaxed">
            지난번에 {label}을 지었어.{'\n'}
            지금부터 쓰는 일기를 어떻게 할래?
          </Body>
        </Card>

        <Card className="mb-6">
          <Caption className="text-gray-400 leading-relaxed">
            새로 시작해도, 이어 써도 *돌아온 게 아니라 사이클의 일부*야.{'\n'}
            정답이 아니야. 네 속도가 맞아.
          </Caption>
        </Card>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="새 사이클로 다시 시작할래" onPress={handleNewCycle} />
        <PrimaryButton label="이어서 쓸래" variant="ghost" onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}
