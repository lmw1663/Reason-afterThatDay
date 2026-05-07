/**
 * 매듭 권유 모달 쿨다운 — F-3
 *
 * 사용자가 권유 모달을 거절했을 때, 7일간 재발화 차단.
 * 스펙: docs/psychology-logic/redesign-graduation.md §4-3, §10 Q3 후속
 *
 * 본 모듈은 *순수 함수*만 — 시간 비교 로직을 store와 분리해 테스트 가능하게 함.
 * useKnotStore가 declinedAt 상태를 관리하고 본 모듈로 판정.
 */

export const KNOT_COOLDOWN_DAYS = 7;

/**
 * 거절 후 쿨다운 기간 내인지 판정.
 * @param declinedAt 마지막 거절 시각 (ISO string). null이면 거절 이력 없음.
 * @param now 현재 시각. (테스트 주입 가능)
 * @param days 쿨다운 일수 (기본 7).
 */
export function isInKnotCooldown(
  declinedAt: string | null,
  now: Date = new Date(),
  days: number = KNOT_COOLDOWN_DAYS,
): boolean {
  if (!declinedAt) return false;
  const declinedMs = new Date(declinedAt).getTime();
  if (Number.isNaN(declinedMs)) return false; // 잘못된 ISO → 안전하게 쿨다운 아님
  const cooldownMs = days * 24 * 60 * 60 * 1000;
  return now.getTime() - declinedMs < cooldownMs;
}

/**
 * 같은 cycle에서 권유 모달이 이미 발화됐는지 판정.
 * 1 cycle = 매듭 한 번. cycle_index 일치 시 재발화 차단.
 *
 * @param lastTriggerCycle 마지막 발화의 cycle_index. null이면 발화 이력 없음.
 * @param currentCycle 현재 cycle_index. relationship_profile.cycle_count 또는 graduation_cooling.cycle_index 기준.
 */
export function isPromptedThisCycle(
  lastTriggerCycle: number | null,
  currentCycle: number,
): boolean {
  return lastTriggerCycle !== null && lastTriggerCycle === currentCycle;
}
