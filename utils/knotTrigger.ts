/**
 * 매듭 권유 모달 트리거 평가 — F-6
 *
 * 스펙 docs/psychology-logic/redesign-graduation.md §4-3 — 6조건 AND 평가:
 *   1. 시간 조건           — daysElapsed ≥ policy.triggerDay (페르소나별)
 *   2. 회복 안정성         — 최근 7일 평균 mood_score ≥ 4
 *   3. 위기 신호 없음      — 최근 3일 mood 1~2점 없음 + 새벽(0~4시) 진입 없음
 *   4. C-SSRS 잠금 해제    — 결정 트랙 잠금 상태 아님
 *   5. 페르소나 권유 가능  — knotPolicy.triggerAllowed (P03·P11·P16·P19 비허용)
 *   6. 재발화 방지         — 7일 쿨다운 + 같은 cycle 1회만
 *
 * 본 모듈은 순수 함수. store 데이터 수집·라우팅은 hooks/useKnotTrigger.ts 책임.
 */

import { resolveKnotPolicy } from './knotPolicy';
import type { ResolvedPersona } from './personaResolver';

export interface KnotTriggerInput {
  /** 이별 D+N. */
  daysElapsed: number;
  /** 최근 7일 mood_score (1~10 스케일). 빈 배열이면 데이터 부족. */
  moodTrend: number[];
  /** 최근 3일 mood_score — 위기 신호(1~2점) 검사용. */
  recent3DaysMood: number[];
  /** 결정 트랙(분석·나침반) 잠금 해제 상태. C-SSRS 양성 시 false. */
  decisionLockUnlocked: boolean;
  /** personaResolver 결과. */
  resolved: ResolvedPersona;
  /** useKnotStore.canPromptNow(cycleCount) 결과 — 7일 쿨다운·같은 cycle 검사 통과 여부.
   *  cycle_count는 본 평가에서 직접 사용하지 않고, hook 측에서 canPromptNow에 주입한다. */
  knotCanPrompt: boolean;
  /** 현재 시각의 hour (0~23). 새벽 진입(0~4) 검사. */
  hour: number;
}

export type KnotTriggerReason =
  | 'persona_disallowed'
  | 'before_d_threshold'
  | 'decision_locked'
  | 'low_mood'
  | 'crisis_signal'
  | 'late_night'
  | 'cooldown';

export type KnotTriggerResult =
  | { allowed: true }
  | { allowed: false; reason: KnotTriggerReason };

const MOOD_AVG_THRESHOLD = 4; // 회복 안정성 임계값
const CRISIS_MOOD_THRESHOLD = 2; // 1~2점 = 위기 신호
const LATE_NIGHT_START = 0;
const LATE_NIGHT_END = 5; // 0~4시 inclusive (CLAUDE.md 절대 규칙과 동일 정의)

/**
 * 6조건 AND 평가. 어느 조건이라도 실패하면 첫 실패 reason 반환.
 *
 * **순서 중요**: 페르소나 비허용 → 시간 → 잠금 → 회복 → 위기 → 쿨다운.
 * 임상적으로 더 *근본적인* 차단부터 검사해 reason을 명확히 노출.
 */
export function evaluateKnotTrigger(input: KnotTriggerInput): KnotTriggerResult {
  const policy = resolveKnotPolicy(input.resolved);

  // 1. 페르소나 권유 가능 여부 (가장 근본적 — 분류 자체가 비허용이면 다른 검사 의미 없음)
  if (!policy.triggerAllowed) {
    return { allowed: false, reason: 'persona_disallowed' };
  }

  // 2. 시간 조건
  if (input.daysElapsed < policy.triggerDay) {
    return { allowed: false, reason: 'before_d_threshold' };
  }

  // 3. C-SSRS 잠금 해제
  if (!input.decisionLockUnlocked) {
    return { allowed: false, reason: 'decision_locked' };
  }

  // 4. 회복 안정성 — 데이터 부족 시 안전 default(불허)
  if (input.moodTrend.length === 0) {
    return { allowed: false, reason: 'low_mood' };
  }
  const avg = input.moodTrend.reduce((a, b) => a + b, 0) / input.moodTrend.length;
  if (avg < MOOD_AVG_THRESHOLD) {
    return { allowed: false, reason: 'low_mood' };
  }

  // 5a. 위기 신호 — 최근 3일 mood 1~2점 존재
  if (input.recent3DaysMood.some((m) => m <= CRISIS_MOOD_THRESHOLD)) {
    return { allowed: false, reason: 'crisis_signal' };
  }

  // 5b. 새벽 진입 — 위기 시간대 진입 자체로 차단
  if (input.hour >= LATE_NIGHT_START && input.hour < LATE_NIGHT_END) {
    return { allowed: false, reason: 'late_night' };
  }

  // 6. 재발화 방지 (useKnotStore에서 이미 평가 — 입력으로 받음)
  if (!input.knotCanPrompt) {
    return { allowed: false, reason: 'cooldown' };
  }

  return { allowed: true };
}
