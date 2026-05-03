/**
 * 다중 페르소나 충돌 해소 — C-3-H
 *
 * 매트릭스 §4-1 R0~R5 알고리즘 본 구현.
 * usePersonaStore의 (primary, secondary) 동시 분기 요구를 *단일 결정*으로 환원.
 *
 * SSOT: docs/psychology-logic/페르소나-화면-액션-매트릭스.md §4 (R0~R5 + 충돌 케이스 8개)
 *       docs/psychology-logic/참고용.md §3-1 (유형 기반 시급도)
 *
 * 본 함수는 *어떤 페르소나의 분기를 적용할지*만 결정. 화면별 액션 차단(상대 단점 OFF·미니
 * 일기 강제 등)은 constants/personaBranches.ts의 화면 헬퍼가 effective + guardOverlay를
 * 받아 처리. appliesGuard·appliesRecommendation 헬퍼로 검사.
 *
 * 분리 원칙:
 *   - effective: 권장(✅) 액션 적용할 페르소나 — 단일.
 *     R5에서 참고용 §3-1 유형 시급도로 effective가 부로 *스왑*될 수 있음 (예: 주 D 의미 +
 *     부 C 조절 → C가 더 시급해 effective=secondary). 매트릭스 §4-1 의사코드의 "primary 고정"보다
 *     §3-1 시급도를 우선 — §4-1 line 391~432에 본 정책 명시.
 *   - guardOverlay: 금기(❌) 액션도 함께 적용할 부 페르소나 — R5 "부의 금기만 추가".
 *     R2(HARMFUL_RELATIONSHIP)에서도 overlay는 항상 부착 — §4-2 #7 "P20+P03 둘 다 적용" 정합.
 *     (R2는 *권장*만 차단할 뿐 부의 *금기*는 통과시켜야 위기 트리거 시간대 등 보호 신호 보존)
 *   - source: 결정 근거 (디버그·로그용)
 */

import type { PersonaCode } from './personaClassifier';
import { resolvePersonaPriority } from '@/constants/personaBranches';

export type ResolutionSource =
  | 'crisis_override'    // R0 — C-SSRS lockout 활성, 페르소나 분기 무시
  | 'primary_only'       // R2 단독 — HARMFUL_RELATIONSHIP, 부 무시
  | 'primary_with_guard' // R2 + 부가 외부복잡도, R5 일반
  | 'secondary'          // R3 — P12 안정형이 주, 부를 실질로
  | 'split_complexity'   // R4 — 외부복잡도 둘 다, 행정·정서 분리
  | 'none';              // primary 없음 (P12 baseline 또는 미분류)

export interface ResolvedPersona {
  source: ResolutionSource;
  /** ✅권장 액션을 적용할 페르소나. null = 분기 없음 (baseline 흐름). */
  effective: PersonaCode | null;
  /** ❌금기 액션을 *추가*로 적용할 페르소나 (R5). null = 단일 페르소나. */
  guardOverlay: PersonaCode | null;
}

/** 매트릭스 §4-1 R2 — 유해 관계 페르소나는 균형 액션 무조건 차단 우선. */
const HARMFUL_RELATIONSHIP: readonly PersonaCode[] = ['P01', 'P14', 'P20'] as const;

/** 매트릭스 §4-1 R4 — 외부복잡도 페르소나는 행정·정서 분리 트랙 필요. */
const COMPLEXITY_PERSONAS: readonly PersonaCode[] = ['P15', 'P16', 'P18'] as const;

function isHarmful(p: PersonaCode | null): boolean {
  return p !== null && HARMFUL_RELATIONSHIP.includes(p);
}

function isComplexity(p: PersonaCode | null): boolean {
  return p !== null && COMPLEXITY_PERSONAS.includes(p);
}

/**
 * (primary, secondary)를 단일 ResolvedPersona로 환원.
 *
 * @param crisisLockout C-SSRS lockout 활성 여부. true면 R0로 즉시 종결.
 *
 * 매트릭스 §4-2 충돌 케이스 8개 *기대 결과*:
 *
 * | 주 | 부 | source              | effective | overlay | 비고 |
 * |---|---|---------------------|-----------|---------|------|
 * | P10 | P05 | primary_with_guard | P10 | P05 | 거칠게 모드 + 죄책감 라벨 |
 * | P03 | P11 | primary_with_guard | P03 | P11 | 둘 다 14일 — 충돌 없음 |
 * | P01 | P02 | primary_with_guard | P01 | P02 | R2 + 부의 금기 overlay (P02 미니 차용 가능) |
 * | P19 | P03 | primary_with_guard | P19 | P03 | pros·cons ≤7 + 단점 D+14 |
 * | P12 | P05 | secondary          | P05 | null| R3 — P12 baseline은 부를 실질로 |
 * | P15 | P16 | split_complexity   | P15 | P16 | R4 — 행정 + opt-out 동시 |
 * | P20 | P03 | primary_with_guard | P20 | P03 | R2 + 부의 금기 overlay (새벽 트리거 보존) |
 * | P04 | P10 | primary_with_guard | P10 | P04 | C 조절 > D 의미 (유형 시급도로 effective 스왑) |
 *
 * P01+P02 케이스 주의: 매트릭스 §4-2 본문은 "P02 미니만 차용"이라고 적혀 있으나, R2 적용으로
 * effective는 P01 고정. 화면 측에서 isMiniJournalFirst(overlay)도 검사하면 P02 미니 차용 가능
 * — appliesGuard 패턴으로 처리.
 */
export function resolvePersona(
  primary: PersonaCode | null,
  secondary: PersonaCode | null,
  opts: { crisisLockout?: boolean } = {},
): ResolvedPersona {
  // R0. 위기 lockout — 페르소나 분기 자체 무시 (위기 자원·핫라인만 노출)
  if (opts.crisisLockout) {
    return { source: 'crisis_override', effective: null, guardOverlay: null };
  }

  // primary 미정 → baseline (P12 흐름과 동등). secondary 정보는 상위 store에서만 의미.
  if (!primary) {
    return { source: 'none', effective: null, guardOverlay: null };
  }

  // 정규화: 동일 코드 중복 → secondary 무시 (디버그 혼란 + appliesGuard 중복 호출 방지)
  const sec = secondary === primary ? null : secondary;

  // R1. P13 사별 — 분류기가 반환하지 않음. 안전장치 (도달 불가)
  // (PersonaCode 타입에서 P13 제외됐으므로 컴파일 시 차단됨)

  // R2. HARMFUL_RELATIONSHIP이 주 → primary 우선 + 부의 금기 overlay (있으면).
  // 부의 *권장*은 차단되지만 *금기*는 보존 (예: P20+P03 → 학대 라인 + P03 새벽 트리거).
  if (isHarmful(primary)) {
    if (sec) {
      return { source: 'primary_with_guard', effective: primary, guardOverlay: sec };
    }
    return { source: 'primary_only', effective: primary, guardOverlay: null };
  }

  // R3. P12 안정형이 주 → 부를 실질로 (baseline 위장 방지)
  if (primary === 'P12' && sec) {
    return { source: 'secondary', effective: sec, guardOverlay: null };
  }

  // R4. 외부복잡도 둘 다 → 행정·정서 분리 트랙
  if (isComplexity(primary) && sec && isComplexity(sec)) {
    return { source: 'split_complexity', effective: primary, guardOverlay: sec };
  }

  // R5. 일반 케이스 — 참고용 §3-1 유형 시급도로 effective 결정 + 금기 overlay
  if (!sec) {
    return { source: 'primary_only', effective: primary, guardOverlay: null };
  }

  const priority = resolvePersonaPriority(primary, sec);
  if (priority === 'secondary') {
    // 유형 시급도가 부를 더 위급으로 판단 (예: 주 D 의미 + 부 C 조절). effective 스왑.
    return { source: 'primary_with_guard', effective: sec, guardOverlay: primary };
  }
  // 'primary' 또는 'merged' — effective는 주, overlay는 부
  return { source: 'primary_with_guard', effective: primary, guardOverlay: sec };
}

// ───────── 화면 코드용 적용 헬퍼 ─────────

/**
 * effective + guardOverlay 양쪽에 대해 *금기 검사* 수행.
 * 한 쪽이라도 true면 차단(true). R5 "부의 금기만 추가" 정책 구현.
 *
 * 사용 예 (분석 화면):
 *   const resolved = resolvePersona(primary, secondary);
 *   const consBlocked = appliesGuard(resolved, isPartnerConsBlocked);
 */
export function appliesGuard(
  resolved: ResolvedPersona,
  guardCheck: (p: PersonaCode | null) => boolean,
): boolean {
  if (guardCheck(resolved.effective)) return true;
  if (resolved.guardOverlay && guardCheck(resolved.guardOverlay)) return true;
  return false;
}

/**
 * effective만 검사 — *권장 액션*은 주 페르소나(또는 R3에서 부)만 적용.
 * 사용 예 (일기 화면): isMiniJournalFirst(resolved.effective).
 */
export function appliesRecommendation(
  resolved: ResolvedPersona,
  recommendCheck: (p: PersonaCode | null) => boolean,
): boolean {
  return recommendCheck(resolved.effective);
}

/**
 * 숫자 *상한* 헬퍼(예: pros·cons 항목 cap) — 양쪽 페르소나 중 더 *작은* 값 적용.
 * 보수적(엄격) 정책: 어느 한 쪽이라도 ≤7 cap이 있으면 7 적용.
 * 사용 예: strictestLimit(resolved, getProsConsItemLimit).
 */
export function strictestLimit(
  resolved: ResolvedPersona,
  limitFn: (p: PersonaCode | null) => number,
): number {
  const a = limitFn(resolved.effective);
  const b = resolved.guardOverlay ? limitFn(resolved.guardOverlay) : Infinity;
  return Math.min(a, b);
}

/**
 * 숫자 *게이트 일수* 헬퍼(예: 나침반 D+N 잠금) — 양쪽 페르소나 중 더 *긴* 값 적용.
 * 보수적(긴 대기) 정책: 어느 한 쪽이라도 D+21 게이트면 21일 대기.
 * 사용 예: longestGate(resolved, getCompassGateDays).
 */
export function longestGate(
  resolved: ResolvedPersona,
  gateFn: (p: PersonaCode | null) => number,
): number {
  const a = gateFn(resolved.effective);
  const b = resolved.guardOverlay ? gateFn(resolved.guardOverlay) : 0;
  return Math.max(a, b);
}
