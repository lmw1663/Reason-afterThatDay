/**
 * useCyclePromptTrigger — F-8
 *
 * 매듭 *완료 후* 처음 홈에 들어올 때 사이클 prompt(이어쓰기 vs 새 사이클)를 띄우기 위한 평가.
 *
 * 트리거 조건 (모두 AND):
 *   1. lastKnotAt !== null (매듭 경험 있음)
 *   2. lastCyclePromptShownForKnotAt !== lastKnotAt (이번 매듭에 대해 아직 prompt 안 봤음)
 *   3. cooling status가 'cooling' 아님 (현재 매듭 진행 중이 아님)
 *
 * "이번 매듭"의 의미: relationship_profile.last_knot_at 시각. 같은 시각엔 한 번만 prompt.
 */

import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useKnotStore } from '@/store/useKnotStore';

export interface CyclePromptTriggerResult {
  /** prompt를 띄워도 되는지. */
  needed: boolean;
  /** 매칭된 매듭 시각 (markCyclePromptShown 호출 시 그대로 전달). */
  knotAt: string | null;
}

export function useCyclePromptTrigger(): CyclePromptTriggerResult {
  const lastKnotAt = useRelationshipStore((s) => s.profile.lastKnotAt);
  const lastShownFor = useKnotStore((s) => s.lastCyclePromptShownForKnotAt);
  const coolingStatus = useCoolingStore((s) => s.status);

  // 1. 매듭 경험 없음
  if (!lastKnotAt) return { needed: false, knotAt: null };

  // 2. 현재 매듭 진행 중 (cooling 단계) — 새 사이클 prompt 의미 없음
  if (coolingStatus === 'cooling') return { needed: false, knotAt: lastKnotAt };

  // 3. 이미 본 매듭
  if (lastShownFor === lastKnotAt) return { needed: false, knotAt: lastKnotAt };

  return { needed: true, knotAt: lastKnotAt };
}
