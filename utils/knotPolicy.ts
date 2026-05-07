/**
 * 매듭 트랙 정책 — F-2
 *
 * 페르소나 → 매듭 cooling_days·label·트리거 가능 여부 매핑.
 * 다중 페르소나 충돌 시 personaResolver 결과 위에 *비허용 우선* 오버레이를 적용한다.
 *
 * SSOT: docs/psychology-logic/redesign-graduation.md §3-2, §4-3-1, §7
 *
 * 충돌 해소 정책 (resolveKnotPolicy):
 *   - effective 또는 guardOverlay 중 하나라도 비허용이면 triggerAllowed=false (보수적)
 *   - coolingDays는 더 긴 값 (P20 30 + P03 14 → 30)
 *   - label은 effective 기준 (R5 — 부의 *권장*은 차단되므로 label 적용 안 함)
 *   - triggerDay는 더 늦은 시점
 *
 * 비허용 페르소나(P03·P11·P16·P19)는 페르소나 재추정으로 이행 시 자동 가능 — 본 모듈은
 * *현재 페르소나 스냅샷*만 본다. 재추정은 persona-reclassify-cron Edge Function 책임.
 *
 * **책임 범위**: cooling_days·label·triggerAllowed·triggerDay만 결정한다.
 * 다음 동작은 본 모듈에 *없음* — F-9 회상 의식 스케줄러 / 페르소나별 화면 컴포넌트 책임:
 *   - P05·P14 D+30/60 재방문 회상 푸시
 *   - P06 D+7 사이클 회고 카드
 *   - P14 자기 용서 D+60 잠금
 *   - P19 3회 번복 시 전문가 의뢰 카드
 *   - P15 행정 체크리스트 분기
 */

import type { PersonaCode } from './personaClassifier';
import type { ResolvedPersona } from './personaResolver';

export type KnotLabel = '매듭' | '마무리' | '단절 30일 달성';
export type KnotCoolingDays = 3 | 7 | 14 | 30;

export interface KnotPolicy {
  coolingDays: KnotCoolingDays;
  label: KnotLabel;
  triggerAllowed: boolean;
  /** D+N 트리거 시점 (30 = 매듭 후 D+30). P20만 30, 그 외 D+30 표준. */
  triggerDay: number;
}

/**
 * 페르소나별 매듭 정책 SSOT — 매트릭스 §C9 + 스펙 §7 표.
 *
 * P13(사별)은 PersonaCode 타입에서 제외 — 본 매핑 도달 불가.
 */
const PERSONA_KNOT_POLICY: Record<PersonaCode, KnotPolicy> = {
  P01: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P02: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P03: { coolingDays: 14, label: '매듭',           triggerAllowed: false, triggerDay: 30 },
  P04: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P05: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P06: { coolingDays: 14, label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P07: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P08: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P09: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P10: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P11: { coolingDays: 14, label: '매듭',           triggerAllowed: false, triggerDay: 30 },
  P12: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P14: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P15: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P16: { coolingDays: 7,  label: '마무리',         triggerAllowed: false, triggerDay: 30 },
  P17: { coolingDays: 7,  label: '마무리',         triggerAllowed: true,  triggerDay: 30 },
  P18: { coolingDays: 7,  label: '매듭',           triggerAllowed: true,  triggerDay: 30 },
  P19: { coolingDays: 7,  label: '매듭',           triggerAllowed: false, triggerDay: 30 },
  P20: { coolingDays: 30, label: '단절 30일 달성', triggerAllowed: true,  triggerDay: 30 },
};

/** baseline 정책 — 페르소나 미분류·null 시 P12 동등 흐름. */
const BASELINE_POLICY: KnotPolicy = {
  coolingDays: 7,
  label: '매듭',
  triggerAllowed: true,
  triggerDay: 30,
};

/**
 * 단일 페르소나의 매듭 정책 반환.
 * null(미분류) → BASELINE_POLICY.
 */
export function getKnotPolicy(p: PersonaCode | null): KnotPolicy {
  if (!p) return BASELINE_POLICY;
  return PERSONA_KNOT_POLICY[p];
}

/**
 * 다중 페르소나 충돌 해소 후 매듭 정책.
 *
 * - R0 crisis_override: 트랙 잠금 (triggerAllowed=false), 라벨·일수는 baseline 유지
 * - 단일 페르소나(overlay 없음): effective 정책 그대로
 * - 다중 페르소나: 비허용 우선 / coolingDays는 longestGate / label은 effective / triggerDay는 max
 *
 * @param resolved personaResolver의 결과
 */
export function resolveKnotPolicy(resolved: ResolvedPersona): KnotPolicy {
  // R0. 위기 lockout — 매듭 트랙 자체 잠금. 정책 자체는 baseline로 두되 진입 차단.
  if (resolved.source === 'crisis_override') {
    return { ...BASELINE_POLICY, triggerAllowed: false };
  }

  const effPolicy = getKnotPolicy(resolved.effective);

  if (!resolved.guardOverlay) {
    return effPolicy;
  }

  const overlayPolicy = getKnotPolicy(resolved.guardOverlay);

  // 비허용 페르소나가 어느 한 쪽이라도 있으면 전체 비허용 (보수적)
  const triggerAllowed = effPolicy.triggerAllowed && overlayPolicy.triggerAllowed;

  // coolingDays: 더 긴 값 적용 (longestGate 패턴)
  const coolingDays = Math.max(
    effPolicy.coolingDays,
    overlayPolicy.coolingDays,
  ) as KnotCoolingDays;

  // label은 effective 우선 — R5에서 부의 *권장* 차단 정책. label은 권장 영역.
  const label = effPolicy.label;

  // triggerDay는 더 늦은 시점 (보수적)
  const triggerDay = Math.max(effPolicy.triggerDay, overlayPolicy.triggerDay);

  return { coolingDays, label, triggerAllowed, triggerDay };
}

/**
 * 매듭 트랙 *진입 가능 여부* — 권유 모달·자발 진입·매듭 탭 모두 단일 가드 공유.
 *
 * 스펙 §10 Q5: "비허용 페르소나는 *자발 진입도 차단*". F-5(권유 모달)·F-6(트리거 평가)·
 * F-7(매듭 탭 진입점)이 각자 triggerAllowed를 재현하지 않고 본 헬퍼만 호출하도록 한다.
 *
 * 사용 예 (F-7 매듭 탭 진입):
 *   if (!canEnterKnotTrack(resolved)) return router.replace('/');
 */
export function canEnterKnotTrack(resolved: ResolvedPersona): boolean {
  return resolveKnotPolicy(resolved).triggerAllowed;
}

/**
 * 페르소나 변경 시 매듭 권유를 다시 시도할 수 있는지 판정.
 * 비허용 → 허용으로 *이행*한 경우만 true. (이전이 허용이면 굳이 재발화 의미 없음)
 *
 * 사용 예: persona-reclassify-cron 결과 처리 시 useKnotStore 리셋 여부 결정.
 */
export function shouldResetKnotCooldownOnPersonaChange(
  prevResolved: ResolvedPersona,
  nextResolved: ResolvedPersona,
): boolean {
  const prev = resolveKnotPolicy(prevResolved);
  const next = resolveKnotPolicy(nextResolved);
  return !prev.triggerAllowed && next.triggerAllowed;
}
