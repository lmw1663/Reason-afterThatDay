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
 * G-5b 신설 카테고리 4종(reality_check·body·needs·identity) 포함.
 * 기존 6 카테고리 + 신규 4 카테고리 위에 *순서*만 분기.
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

  // 페르소나별 우선 카테고리 (key 부분 일치로 매칭). G-5b 신규 트랙 우선 노출.
  const PRIORITY: Partial<Record<PersonaCode, string[]>> = {
    P01: ['reality_check', 'self_love'],                      // 자기 판단 손상 — 현실 검증 우선 (line 41)
    P02: ['body', 'self_care_alone', 'self_care_in_relationship'],  // 회피형 — 신체 우선 (line 60)
    P04: ['self_love', 'strengths'],                          // 잠수당함 — 자존감 회복 우선
    P08: ['identity', 'love_self', 'ideal_match'],            // 장기 권태 — identity 메인 (line 156)
    P09: ['needs', 'self_love', 'strengths'],                 // 헌신 소진 — 너 욕구 우선 (line 169·172)
    // P14: 매트릭스 "자존감 후순위" — self_love 우선 두지 않음. 자기 책임(self_care_alone)만 우선.
    // line 282 "identity 후순위" — identity는 매핑 미포함이라 default 끝에 자연 노출.
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

/**
 * "떠올랐어" 카운터·추세 위젯 노출 페르소나 (매트릭스 §2 C7 P09).
 * 헌신 소진형 사용자에게 회복 진전 시각화로 도움.
 */
const INTRUSIVE_TREND_PERSONAS: PersonaCode[] = ['P09'];

export function shouldShowIntrusiveTrend(p: PersonaCode | null): boolean {
  return p !== null && INTRUSIVE_TREND_PERSONAS.includes(p);
}

// ───────── G-7c 페르소나별 회상 의식 트랙 (매트릭스 §2 C7 P08·P15·P17·P18) ─────────
//
// 각 트랙은 *권장형* 분기 — appliesRecommendation(resolved, isXxxRecommended) 패턴으로
// effective 페르소나만 검사 (R5 부의 권장 차단 원칙). 한 페르소나당 *최대 1개 트랙*만
// 권장되는 상호 배제 구조 (페르소나 라벨 비노출 + 사용자 혼란 방지).

/**
 * 부정 없는 봉인 의식 권장 페르소나 — P08 권태로 끝난 장기 관계.
 * 분노·배신감 라벨 강요 없이 함께한 5+년 시간의 의미를 *그대로 보관*하는 의식.
 * 매트릭스 §2 C7 line 158: "부정 없이 봉인 옵션 (태우지 않고 보관)".
 */
const SEAL_RECOMMENDED: PersonaCode[] = ['P08'];

export function isSealRecommended(p: PersonaCode | null): boolean {
  return p !== null && SEAL_RECOMMENDED.includes(p);
}

/**
 * 짐 정리 의식 권장 페르소나 — P15 동거 정리.
 * 사진·물건 분류 워크시트로 *행정·감정 분리* 트랙 진입.
 * 매트릭스 §2 C7 line 268: "짐 정리 의식 (사진·물건 분류 워크시트)".
 */
const DECLUTTER_RECOMMENDED: PersonaCode[] = ['P15'];

export function isDeclutterRecommended(p: PersonaCode | null): boolean {
  return p !== null && DECLUTTER_RECOMMENDED.includes(p);
}

/**
 * Continuing Bonds 회상 권장 페르소나 — P17 강제 이별.
 * 본인 결정 아닌 이별의 *관계 가치 자체*는 분리해 보존 (catch/let_go 무의미).
 * 매트릭스 §2 C7 line 300: "관계 가치 보존 회상 (Continuing Bonds)".
 */
const CONTINUING_BONDS_RECOMMENDED: PersonaCode[] = ['P17'];

export function isContinuingBondsRecommended(p: PersonaCode | null): boolean {
  return p !== null && CONTINUING_BONDS_RECOMMENDED.includes(p);
}

/**
 * 마주침 동선 정리 권장 페르소나 — P18 사회적 얽힘.
 * 추억 정리 대신 *일상 트리거 정리*로 변형 (마주침 동선·공통 친구 매핑).
 * 매트릭스 §2 C7 line 316: "추억 정리 트랙을 *일상 트리거 정리*로 변형".
 */
const ENCOUNTER_PLAN_RECOMMENDED: PersonaCode[] = ['P18'];

export function isEncounterPlanRecommended(p: PersonaCode | null): boolean {
  return p !== null && ENCOUNTER_PLAN_RECOMMENDED.includes(p);
}

// ───────── Ref-6 연락 충동 보고 칩 노출 차단 (G-6 보조 카드) ─────────

/**
 * 연락 충동 보고 칩(`ContactUrgeChip`) 노출 차단 페르소나.
 *
 * 칩의 본래 목적은 *충동 자가 인식 + 7일 추세*이지만, 일부 페르소나에서는
 * 매일 노출 자체가 임상적으로 역효과:
 *  - P14 외도 가해: 가해자→피해자 연락 충동 +1 카운트는 *행동 권장* 톤이 됨
 *  - P16 결혼·이혼: 자녀 양육·법적 사유로 *필수 연락*이 존재 → 충동 vs 의무 구분 모호
 *  - P17 강제 이별: 사별·접근금지·실종 등 — 연락 자체가 불가능해 노출이 잔인
 *  - P19 ROCD: 매일 "오늘 연락하고 싶었어?" 자체가 강박 도구화 자극
 *  - P20 트라우마 본딩: 연락 = 재희생 위험. +1 누적 표시가 충동 정상화로 흐름
 *
 * 그 외 페르소나는 노출 — 특히 P03·P06·P10은 핵심 타겟.
 *
 * appliesGuard 패턴(R5 "부의 금기만 추가")으로 검사 — effective·overlay 한 쪽이라도
 * 차단 페르소나면 숨김. (예: 주 P03 + 부 P14 → P14 보호 우선으로 숨김.)
 */
const CONTACT_URGE_CHIP_BLOCKED: PersonaCode[] = ['P14', 'P16', 'P17', 'P19', 'P20'];

export function isContactUrgeChipBlocked(p: PersonaCode | null): boolean {
  return p !== null && CONTACT_URGE_CHIP_BLOCKED.includes(p);
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
