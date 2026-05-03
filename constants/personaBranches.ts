import type { PersonaCode } from '@/utils/personaClassifier';
import { getPersonaTypology } from './personaTypology';

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

// ───────── G-6 분석 pros·cons 분기 ─────────

/**
 * 분석 pros·cons에서 *상대 장점* 탭 차단할 페르소나 (매트릭스 §2 C6).
 * - P01·P20: 자기 판단 손상·트라우마 본딩 — 상대 미화로 이어져 위험
 */
const PARTNER_PROS_BLOCKED: PersonaCode[] = ['P01', 'P20'];

export function isPartnerProsBlocked(p: PersonaCode | null): boolean {
  return p !== null && PARTNER_PROS_BLOCKED.includes(p);
}

/**
 * 분석 pros·cons에서 *상대 단점* 탭 차단할 페르소나 (매트릭스 §2 C6).
 * - P14: 외도 가해 — 상대 단점 찾기는 자기 정당화로 이어져 회복 차단
 * - P01·P20: 매트릭스 "본인 단점만" 의도 — 상대 단점 트랙도 차단해 자기 단점 우선 (about-me로 우회)
 */
const PARTNER_CONS_BLOCKED: PersonaCode[] = ['P14', 'P01', 'P20'];

export function isPartnerConsBlocked(p: PersonaCode | null): boolean {
  return p !== null && PARTNER_CONS_BLOCKED.includes(p);
}

/**
 * 분석 트랙 *전체* 진입 차단 페르소나 (매트릭스 §2 C6).
 * P01·P14·P20은 두 탭이 모두 차단되므로 분석 자체 부적합 — about-me로 우회.
 * me.tsx 분석 카드 비활성 + analysis/_layout deep link 가드.
 */
const ANALYSIS_TRACK_BLOCKED: PersonaCode[] = ['P01', 'P14', 'P20'];

export function isAnalysisTrackBlockedByPersona(p: PersonaCode | null): boolean {
  return p !== null && ANALYSIS_TRACK_BLOCKED.includes(p);
}

/**
 * pros·cons 항목 수 상한 (매트릭스 §2 C6 P19).
 * - P19: 항목 ≤ 7 — 강박적 무한 추가가 강박 도구화되는 것 차단
 * - 그 외: Infinity (무제한)
 */
export function getProsConsItemLimit(p: PersonaCode | null): number {
  if (p === 'P19') return 7;
  return Infinity;
}

// ───────── G-5a about-me 카테고리 정렬 ─────────

/**
 * about-me 카테고리 정렬 — 페르소나별 우선 순서 (매트릭스 §2 C5).
 *
 * 기존 ReflectionCategory 6개(love_self·ideal_match·self_love·strengths·
 * self_care_in_relationship·self_care_alone) 위에 *순서*만 분기.
 * 신규 카테고리(reality-check·identity·body·needs 등)는 G-5b 또는 별도 후속.
 *
 * **주의**: 본 strengths는 *내 장점*. 매트릭스의 "상대 장점 비활성"(P01·P14·P20)은
 * 분석 트랙(C6 pros·cons)에서 처리 — 본 함수 범위 밖.
 *
 * @param defaultOrder 기본 카테고리 순서 (about-me/index.tsx에서 전달)
 * @returns 페르소나별 우선 정렬된 순서
 */
export function sortAboutMeCategories<T extends string>(
  defaultOrder: readonly T[],
  p: PersonaCode | null,
): T[] {
  if (!p) return [...defaultOrder];

  // 페르소나별 우선 카테고리 (key 부분 일치로 매칭)
  const PRIORITY: Partial<Record<PersonaCode, string[]>> = {
    P02: ['self_care_alone', 'self_care_in_relationship'],   // 회피형 — 신체 돌봄 우선
    P04: ['self_love', 'strengths'],                          // 잠수당함 — 자존감 회복 우선
    // P08: 매트릭스는 신규 *identity* 카테고리 지정. G-5b 신설 전 임시로 love_self·ideal_match 근사 매핑.
    P08: ['love_self', 'ideal_match'],
    P09: ['self_love', 'strengths'],                          // 헌신 소진 — 자기 인식 우선
    // P14: 매트릭스 "자존감 후순위" — self_love 우선 두지 않음. 자기 책임(self_care_alone)만 우선.
    // strengths(상대 정당화 위험) 차단은 G-5b로 deferred.
    P14: ['self_care_alone'],
  };

  const priority = PRIORITY[p];
  if (!priority) return [...defaultOrder];

  const head = priority.filter(k => defaultOrder.some(d => d === k)) as T[];
  const tail = defaultOrder.filter(d => !head.includes(d as T));
  return [...head, ...tail];
}

// ───────── Ref-2 다중 페르소나 우선순위 매트릭스 (참고용 §3-1) ─────────

/**
 * 다중 페르소나 우선순위 결정 — 참고용 §3-1
 *
 * 매트릭스 §4-1의 R0~R5 알고리즘을 *유형 기반*으로 보강.
 * Task 2-3-H(`utils/personaResolver.ts`) 본 구현 시 본 헬퍼를 결합.
 *
 * 결정 규칙:
 *  - 주가 A 안전 → primary (어떤 부 페르소나도 안전 우선)
 *  - 주 B 접촉 + 부 D 의미 → primary (의미 부여를 머리로만 하면 회피 강화)
 *  - 주 C 조절 + 부 D 의미 → primary (조절 안 되면 의미 작업 불가)
 *  - 주 C 조절 + 부 B 접촉 → 'merged' (충동성·해리 양쪽 고려)
 *  - 주 D 의미 + 부 A/B/C → secondary (부 페르소나가 더 시급)
 *  - 그 외 → 'merged'
 *
 * 매트릭스 R2 책임 분리: HARMFUL_RELATIONSHIP(P01·P14·P20)의 화면별 액션 차단(상대 단점 OFF 등)은
 * isPartnerProsBlocked 등 별도 헬퍼가 처리. 본 함수는 *유형 기반 시급도*만 산출.
 * P01은 C 조절로 분류돼 R2 자동 우선에 들어가지 않음 — 의도적 분리 (액션 차단은 별도 헬퍼).
 */
export type PriorityResolution = 'primary' | 'secondary' | 'merged';

export function resolvePersonaPriority(
  primary: PersonaCode | null,
  secondary: PersonaCode | null,
): PriorityResolution {
  const pType = getPersonaTypology(primary);
  const sType = getPersonaTypology(secondary);

  if (!pType) return 'primary';
  if (!sType) return 'primary';

  // 안전 우선 — 무조건 주
  if (pType === 'A_safety') return 'primary';
  if (sType === 'A_safety') return 'secondary';

  // 의미 재구성보다 감정 접촉/조절이 시급
  if (pType === 'D_meaning' && (sType === 'B_contact' || sType === 'C_regulation')) {
    return 'secondary';
  }
  if (pType === 'B_contact' && sType === 'D_meaning') return 'primary';
  if (pType === 'C_regulation' && sType === 'D_meaning') return 'primary';

  // 조절 + 접촉 동시 → merged (런타임 추가 신호로 결정)
  if (pType === 'C_regulation' && sType === 'B_contact') return 'merged';
  if (pType === 'B_contact' && sType === 'C_regulation') return 'merged';

  // 같은 유형 또는 외부복잡도 등 → merged
  return 'merged';
}

// ───────── Ref-4 P14 자기 용서 트랙 D+60 잠금 (참고용 §2 P14) ─────────

/**
 * P14(외도 가해 후회) 자기 용서 트랙 잠금 해제 여부.
 * 참고용: D+60 이전 자기 용서는 자기 정당화로 흐를 위험. 수치심 시기엔 *행동 책임*만.
 *
 * 본 함수는 향후 *자기 용서 카드/트랙* 신설 시 게이트로 사용 (D-5 또는 별도 후속).
 * P14 외 페르소나는 항상 unlocked(true) — 본 게이트는 P14에만 적용.
 */
const SELF_FORGIVENESS_GATE_DAYS = 60;

export function isSelfForgivenessUnlocked(
  p: PersonaCode | null,
  daysElapsed: number,
): boolean {
  if (p !== 'P14') return true;
  return daysElapsed >= SELF_FORGIVENESS_GATE_DAYS;
}

// ───────── Ref-5 부치지 않을 편지 권장 페르소나 ─────────

/**
 * 부치지 않을 편지 보관함 권장 페르소나 (참고용 §2 P02·P10·P17).
 * - P10: 분노 venting 1차 통로
 * - P02: 빈 페이지 회피 우회
 * - P17: 미완의 말 표출
 *
 * 다른 페르소나도 사용 가능 — 본 함수는 *권장 노출*에만 사용.
 */
const UNSENT_LETTER_RECOMMENDED: PersonaCode[] = ['P02', 'P10', 'P17'];

export function isUnsentLetterRecommended(p: PersonaCode | null): boolean {
  return p !== null && UNSENT_LETTER_RECOMMENDED.includes(p);
}

// ───────── G-7a 추억 트랙 분기 (매트릭스 §2 C7) ─────────

/**
 * 능동 회상 트랙에서 *미화 카테고리* 차단할 페르소나 (매트릭스 §2 C7).
 * - P01·P20: 자기 판단 손상·트라우마 본딩 — 상대 미화로 단절 의지 약화
 * - P10: 분노 단계 미화는 분노→슬픔 통합 방해
 * - P14: 외도 가해 자기 정당화 차단
 *
 * 차단 카테고리: 'happy', 'miss' (행복했던 순간·지금도 그리운 것).
 * 'painful'·'growth'는 회복 작업이라 통과.
 */
const MEMORY_GLAMOUR_BLOCKED: PersonaCode[] = ['P01', 'P10', 'P14', 'P20'];

export function isMemoryGlamourBlocked(p: PersonaCode | null): boolean {
  return p !== null && MEMORY_GLAMOUR_BLOCKED.includes(p);
}

/**
 * 능동 회상 트랙 D+N 게이트 (매트릭스 §2 C7).
 * - P03 (불안형): D+21까지 지연 — 미련 자극 차단
 * - 기타: 0 (제한 없음)
 */
export function getMemoryReflectGateDays(p: PersonaCode | null): number {
  if (p === 'P03') return 21;
  return 0;
}

// ───────── Ref-3 새벽 푸시 차단 (참고용 §2 P03) ─────────

/**
 * 새벽(00~05시) 푸시 차단 페르소나 (참고용 §2 P3).
 * 불안형 사용자에게 가장 위험한 시간대에 알림이 충동을 자극하지 않도록.
 *
 * 위기 자원 푸시(B-1 safety-followup-cron 등)는 *예외* — kind='crisis' notification은 통과.
 * 본 함수는 *kind 무관*하게 페르소나·시간만 체크. 호출처에서 kind 별도 체크 필요.
 */
const LATE_NIGHT_SUPPRESSED_PERSONAS: PersonaCode[] = ['P03'];

export function isLateNightPushSuppressed(p: PersonaCode | null, hour: number): boolean {
  if (p === null) return false;
  if (!LATE_NIGHT_SUPPRESSED_PERSONAS.includes(p)) return false;
  return hour < 5;  // 0~4시
}
