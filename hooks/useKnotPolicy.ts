/**
 * useKnotPolicy — F-7 + F-12 P1-D
 *
 * 페르소나 기반 매듭 정책(label·coolingDays·triggerAllowed·triggerDay).
 *
 * **P1-D 분기**: cooling 진행 중(status='cooling')이면 *매듭 신청 시점 스냅샷*(DB
 * graduation_cooling.knot_label·cooling_period_days)을 우선 사용. 이렇게 하면 페르소나
 * 재추정으로 cooling 도중 라벨·일수가 바뀌는 것을 막는다 — 사용자가 신청한 *그* 매듭으로
 * 일관되게 진행.
 *
 * 그 외(권유 모달·archive 빈상태·cycle prompt 등)는 *현재 페르소나*로 정책 도출 — 새
 * 매듭의 라벨·일수가 *현재* 페르소나 기준이어야 자연스럽다.
 *
 * 사용 예 (graduation 어휘 교체):
 *   const { label, coolingDays } = useKnotPolicy();
 *   <Caption>{label} · 1 / 5</Caption>
 *   <Body>{coolingDays}일 유예 시작하기</Body>
 */

import { usePersonaStore } from '@/store/usePersonaStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { resolvePersona } from '@/utils/personaResolver';
import {
  resolveKnotPolicy,
  type KnotCoolingDays,
  type KnotLabel,
  type KnotPolicy,
} from '@/utils/knotPolicy';

export function useKnotPolicy(): KnotPolicy {
  const primary = usePersonaStore((s) => s.primary);
  const secondary = usePersonaStore((s) => s.secondary);
  const coolingStatus = useCoolingStore((s) => s.status);
  const coolingLabel = useCoolingStore((s) => s.knotLabel);
  const coolingDays = useCoolingStore((s) => s.coolingPeriodDays);

  const personaPolicy = resolveKnotPolicy(resolvePersona(primary, secondary));

  // P1-D: cooling 활성 시 신청 시점 스냅샷 우선
  if (coolingStatus === 'cooling' && coolingLabel && coolingDays != null) {
    return {
      ...personaPolicy,
      label: coolingLabel as KnotLabel,
      coolingDays: coolingDays as KnotCoolingDays,
    };
  }

  return personaPolicy;
}
