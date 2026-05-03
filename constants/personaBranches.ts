import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 페르소나 분기 predicate 모음 — C-2-G-3a~
 *
 * 사용자 노출 화면 코드(app/, components/)에서 *페르소나 코드 string*을 직접 박지 않도록
 * 본 헬퍼만 import해서 분기. lint:persona가 화면 코드의 'P01' 등 노출을 차단하므로
 * 모든 분기 룰은 utils/constants에 데이터로 두고 화면은 함수 호출만.
 *
 * 매트릭스 §2 셀별로 분기 함수 추가. 신규 화면 분기 시 본 파일을 먼저 갱신.
 */

// ───────── 일기 분기 (C-2-G-3a) ─────────

/** 미니 모드를 *primary 시각*으로 강조할 페르소나 (매트릭스 §2 C3 P02) */
const MINI_FIRST_PERSONAS: PersonaCode[] = ['P02'];

export function isMiniJournalFirst(p: PersonaCode | null): boolean {
  return p !== null && MINI_FIRST_PERSONAS.includes(p);
}

/** 거칠게 모드(raw-mode) 진입 가능 페르소나 (매트릭스 §2 C3 P10) — 본 화면은 D-5 구현 */
const RAW_MODE_PERSONAS: PersonaCode[] = ['P10'];

export function isRawModeAllowed(p: PersonaCode | null): boolean {
  return p !== null && RAW_MODE_PERSONAS.includes(p);
}

/** 감정 라벨에 "공허/멍함/시들음" 우선 노출 (매트릭스 §2 C3 P08) */
const EMPTINESS_LABELS_PRIORITY: PersonaCode[] = ['P08'];

export function isEmptinessLabelsPriority(p: PersonaCode | null): boolean {
  return p !== null && EMPTINESS_LABELS_PRIORITY.includes(p);
}

// ───────── G-3b 일기 자유 메모 placeholder 분기 ─────────

/**
 * 페르소나별 일기 자유 메모 placeholder (매트릭스 §2 C3).
 * 페르소나 미정 또는 baseline은 default 반환.
 */
export function getJournalFreeTextPlaceholder(p: PersonaCode | null): string {
  switch (p) {
    case 'P04': return '"내가 *아는 것*"과 "내가 *상상한 것*"을 나눠 써봐';
    case 'P09': return '오늘 *너*에 대한 한 줄. 상대 추측 말고';
    case 'P17': return '그때 못 한 말, 지금 여기에 풀어볼래';
    case 'P10': return '거칠게 써도 돼. 표출 후 함께 다른 감정도 보자';
    default:    return '더 하고 싶은 말이 있으면 써봐 (선택)';
  }
}

/**
 * P14 (외도 가해 후회) — 일기 진입 시 "수치심 ≠ 죄책감" 심리교육 카드 1회 노출.
 * (매트릭스 §2 C3 P14)
 */
const SHAME_GUILT_EDU_PERSONAS: PersonaCode[] = ['P14'];

export function shouldShowShameGuiltEducation(p: PersonaCode | null): boolean {
  return p !== null && SHAME_GUILT_EDU_PERSONAS.includes(p);
}

// ───────── G-4 나침반 modifier ─────────

/**
 * 나침반 진입 D+N 게이트 — baseline D+7. 페르소나별 더 늦게 (매트릭스 §2 C4).
 * P17은 도메인 부적합으로 *영구 비활성* (별도 isCompassDisabled 사용).
 */
export function getCompassGateDays(p: PersonaCode | null): number {
  switch (p) {
    case 'P02': return 10;  // 회피형 — 늦게
    case 'P04': return 14;  // 갑작스러운 통보 — 충격 단계 후
    case 'P07': return 21;  // 첫 이별 — 비교 대상 부재
    default:    return 7;   // baseline
  }
}

/**
 * 나침반 자체 비활성 페르소나 (매트릭스 §2 C4).
 * P17(강제 이별) — *결정·방향 차원 부적합*. 본인 결정이 아니라 수용 작업이 우선.
 */
const COMPASS_DISABLED_PERSONAS: PersonaCode[] = ['P17'];

export function isCompassDisabledByPersona(p: PersonaCode | null): boolean {
  return p !== null && COMPASS_DISABLED_PERSONAS.includes(p);
}

/**
 * 나침반 verdict 화면 후미 텍스트 (매트릭스 §2 C4).
 * - P01·P20: "너의 잘못이 아니야" 강제 (자기 판단 손상·트라우마 본딩 자책 차단)
 * - P19: "지금은 결정 안 해도 괜찮아" (강박 vs 결정 추구 분리)
 * - P14: "행동 단위로 분해하자" (가해자 자기 정당화 차단)
 */
export function getCompassVerdictFooter(p: PersonaCode | null): string | null {
  switch (p) {
    case 'P01':
    case 'P20':
      return '너의 잘못이 아니야. 사실을 사실대로 본 거야.';
    case 'P19':
      return '지금은 결정 안 해도 괜찮아. 결정을 미루는 것도 결정이야.';
    case 'P14':
      return '결정의 정당화 대신, 다음 행동을 한 가지만 정해보자.';
    default:
      return null;
  }
}
