/**
 * useKnotTrigger — F-6
 *
 * 홈 진입 시 매듭 권유 모달의 6조건 AND 평가 hook.
 * store들에서 데이터를 모아 utils/knotTrigger의 순수 평가 함수로 위임.
 *
 * 사용 예 (app/(tabs)/index.tsx):
 *   const trigger = useKnotTrigger();
 *   useEffect(() => {
 *     if (trigger.allowed) router.push('/knot/prompt');
 *   }, [trigger.allowed]);
 */

import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useKnotStore } from '@/store/useKnotStore';
import { useDecisionLockGuard } from './useDecisionLockGuard';
import { useGraduationLockGuard } from './useGraduationLockGuard';
import { resolvePersona } from '@/utils/personaResolver';
import { evaluateKnotTrigger, type KnotTriggerResult } from '@/utils/knotTrigger';

export function useKnotTrigger(): KnotTriggerResult {
  const daysElapsed = useUserStore((s) => s.daysElapsed);
  const moodTrend = useJournalStore((s) => s.stats?.moodTrend ?? []);
  const primary = usePersonaStore((s) => s.primary);
  const secondary = usePersonaStore((s) => s.secondary);
  const cycleCount = useRelationshipStore((s) => s.profile.cycleCount);
  const canPromptNow = useKnotStore((s) => s.canPromptNow);
  const decisionLock = useDecisionLockGuard();
  const graduationLock = useGraduationLockGuard();

  // F-12 P0-3: C-SSRS 양성 시 매듭 트랙 잠금 — graduationLocked가 true면 페르소나 기반 평가에
  // 진입하기 전에 즉시 차단 (crisisLockout=true로 R0 처리).
  const resolved = resolvePersona(primary, secondary, {
    crisisLockout: graduationLock === 'locked',
  });
  const recent3 = moodTrend.slice(-3);
  const knotCanPrompt = canPromptNow(cycleCount);
  const hour = new Date().getHours();

  return evaluateKnotTrigger({
    daysElapsed,
    moodTrend,
    recent3DaysMood: recent3,
    decisionLockUnlocked: decisionLock === 'unlocked',
    resolved,
    knotCanPrompt,
    hour,
  });
}
