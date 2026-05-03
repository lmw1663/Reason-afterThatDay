/**
 * 페르소나 분류 알고리즘 — C-1-3
 *
 * 정책 근거: docs/psychology-logic/페르소나-분류체계.md §4 분기 알고리즘
 *
 * 입력: 온보딩 응답 + 8축 추정값
 * 출력: { primary, secondary, scores, axes }
 *
 * 핵심 규칙:
 *  1. C-SSRS 양성 → mode='crisis_lockout' 즉시 반환 (페르소나 분류 보조로만)
 *  2. P13 사별은 본 앱 도메인 밖 — 분류 반환값에서 P13 제외 (C-1-2)
 *  3. 외도 본인 가해 시 P14 강제 추가
 *  4. 점수 합산 → top-1 (>=5점) → P12 안정형 baseline
 *  5. 외부복잡도 A6 ≥ 2 → P15/P16/P18 중 1개를 *부* 페르소나에 강제
 *
 * 라이선스 게이트:
 *  - PHQ-9·GAD-7·Rosenberg·C-SSRS는 자유 척도 → 본 분류기에서 사용 가능
 *  - ECR-R·RRS는 라이선스 미확인 → 본 분류기에서 *주석 처리* (회신 후 활성화 — TODO)
 */

import { SCORING_RULES, type RuleKey } from './personaScoringRules';

export type PersonaCode =
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05'
  | 'P06' | 'P07' | 'P08' | 'P09' | 'P10'
  | 'P11' | 'P12' /* P13 제외 */ | 'P14' | 'P15'
  | 'P16' | 'P17' | 'P18' | 'P19' | 'P20';

export const PERSONAS: PersonaCode[] = [
  'P01', 'P02', 'P03', 'P04', 'P05',
  'P06', 'P07', 'P08', 'P09', 'P10',
  'P11', 'P12', 'P14', 'P15',
  'P16', 'P17', 'P18', 'P19', 'P20',
];

export const COMPLEXITY_PERSONAS: PersonaCode[] = ['P15', 'P16', 'P18'];
export const HARMFUL_RELATIONSHIP: PersonaCode[] = ['P01', 'P14', 'P20'];

/**
 * 8축 (페르소나-분류체계.md §2)
 */
export interface PsychAxes {
  a1_attachment: 0 | 1 | 2 | 3;          // 안정/불안/회피/두려움
  a2_initiator: 0 | 1 | 2 | 3;           // 합의/본인/상대/잠수
  a3_breakup_mode: 0 | 1 | 2 | 3;        // 점진/명확/갑작/강제
  a4_duration: 0 | 1 | 2 | 3;            // <6m / 6m–2y / 2–5y / 5y+
  a5_health: 0 | 1 | 2 | 3;              // 건강/혼합/유해/학대·외도
  a6_complexity: 0 | 1 | 2 | 3;          // 없음/공동지인/동거·재정/결혼·자녀
  a7_dominant_emotion: 0 | 1 | 2 | 3 | 4; // 슬픔/분노/죄책감/공허/혼란
  a8_crisis: 0 | 1 | 2 | 3;              // 안전/주의/고위험/즉시개입
}

/**
 * 온보딩 응답 — 페르소나-분류체계.md §4 + 페르소나.md 온보딩 식별 흐름
 * (사별 옵션은 도메인 밖이라 제거 — C-1-2)
 */
export interface OnboardingResponses {
  q1_initiator: 'self' | 'partner' | 'mutual' | 'ghosted';
  q2_thought:
    | 'too_sensitive'    // P1 트리거
    | 'alone_better'     // P2
    | 'cant_live_without' // P3/P9
    | 'why_repeat'       // P6
    | 'none';
  q3_count: 'first' | 'second_or_third' | 'same_person_multiple' | 'multiple_different';
  q4_duration_range: '<6m' | '6m-2y' | '2y-5y' | '5y+';
  q4_married: boolean;
  q5_emotion: 'anger' | 'empty' | 'longing' | 'guilt' | 'unsure';
  q6_memory_diverged?: boolean;  // Q2 ① 양성 시만 묻는 조건부 질문
  q_self_infidelity: boolean;
  q_complexity: 'none' | 'shared_circle' | 'cohabitation' | 'marriage';
  q_breakup_reason: 'mutual' | 'sudden' | 'forced';  // 사별 옵션 없음 (C-1-2)
}

export type CrisisLevel = 0 | 1 | 2 | 3;

export interface ClassifyInput {
  responses: OnboardingResponses;
  axes: PsychAxes;
}

export type PersonaResult =
  | { mode: 'crisis_lockout'; primary: null; secondary: null; scores: Record<PersonaCode, number>; axes: PsychAxes }
  | { mode: 'standard'; primary: PersonaCode; secondary: PersonaCode | null; scores: Record<PersonaCode, number>; axes: PsychAxes };

const STANDARD_THRESHOLD = 5;
const TOP_GAP_FOR_SECONDARY = 2;

/**
 * 매칭된 scoring rule 키 추출.
 */
function matchedRuleKeys(r: OnboardingResponses): RuleKey[] {
  const keys: RuleKey[] = [];

  // Q1
  if (r.q1_initiator === 'ghosted') keys.push('q1.ghosted');

  // Q2 + Q6 동시 양성은 *대체 규칙* (페르소나-분류체계.md §4 표 명시)
  const q2_q6_combo = r.q2_thought === 'too_sensitive' && r.q6_memory_diverged === true;
  if (q2_q6_combo) {
    keys.push('q2.too_sensitive+q6.diverged');  // P1(+5) — 단독 행 무시
  } else {
    if (r.q2_thought === 'too_sensitive') keys.push('q2.too_sensitive');
    if (r.q6_memory_diverged === true) keys.push('q6.diverged');
  }

  if (r.q2_thought === 'alone_better')      keys.push('q2.alone_better');
  if (r.q2_thought === 'cant_live_without') keys.push('q2.cant_live_without');
  if (r.q2_thought === 'why_repeat')        keys.push('q2.why_repeat');

  // Q3
  if (r.q3_count === 'first')                 keys.push('q3.first');
  if (r.q3_count === 'same_person_multiple')  keys.push('q3.same_person_multiple');

  // Q4
  if (r.q4_duration_range === '5y+') keys.push('q4.5y_plus');
  if (r.q4_married)                  keys.push('q4.married');

  // Q5
  if (r.q5_emotion === 'anger')   keys.push('q5.anger');
  if (r.q5_emotion === 'empty')   keys.push('q5.empty');
  if (r.q5_emotion === 'longing') keys.push('q5.longing');
  if (r.q5_emotion === 'guilt')   keys.push('q5.guilt');
  if (r.q5_emotion === 'unsure')  keys.push('q5.unsure');

  // 본인 외도
  if (r.q_self_infidelity) keys.push('q_self_infidelity');

  // 외부복잡도
  if (r.q_complexity === 'cohabitation') keys.push('q_complexity.cohabitation');
  if (r.q_complexity === 'shared_circle') keys.push('q_complexity.shared_circle');
  if (r.q_complexity === 'marriage') keys.push('q_complexity.marriage');

  // 이별 사유 (사별 옵션 없음 — C-1-2)
  if (r.q_breakup_reason === 'forced') keys.push('q_reason.forced');

  return keys;
}

function makeEmptyScores(): Record<PersonaCode, number> {
  return PERSONAS.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<PersonaCode, number>);
}

/**
 * 외부복잡도 강제 부 페르소나 선택 — 응답 컨텍스트에 따라 P15/P16/P18 중 1개.
 */
function pickComplexityPersona(r: OnboardingResponses): PersonaCode | null {
  if (r.q_complexity === 'marriage' || r.q4_married) return 'P16';
  if (r.q_complexity === 'cohabitation') return 'P15';
  if (r.q_complexity === 'shared_circle') return 'P18';
  return null;
}

/**
 * 메인 분류 함수.
 */
export function classifyPersona(input: ClassifyInput): PersonaResult {
  const { responses, axes } = input;

  // 1. C-SSRS 양성 → 위기 모드 (페르소나 분류는 보조로만)
  if (axes.a8_crisis >= 3) {
    return { mode: 'crisis_lockout', primary: null, secondary: null, scores: makeEmptyScores(), axes };
  }

  // 2. 점수 합산
  const scores = makeEmptyScores();
  const keys = matchedRuleKeys(responses);
  for (const key of keys) {
    const deltas = SCORING_RULES[key];
    if (!deltas) continue;
    for (const persona of Object.keys(deltas) as PersonaCode[]) {
      if (persona === ('P13' as PersonaCode)) continue;  // P13은 분류 결과에서 제외 (C-1-2)
      scores[persona] += deltas[persona] ?? 0;
    }
  }

  // 3. 본인 외도면 P14 강제 가산 (이미 SCORING_RULES에 +5 부여됐으나 안전망)
  if (responses.q_self_infidelity && scores.P14 < STANDARD_THRESHOLD) {
    scores.P14 = STANDARD_THRESHOLD;
  }

  // 4. top-1 선택
  const sorted = (Object.entries(scores) as Array<[PersonaCode, number]>)
    .sort((a, b) => b[1] - a[1]);
  const [topPersona, topScore] = sorted[0];

  // 5. P12 baseline — 임계 미달
  if (topScore < STANDARD_THRESHOLD) {
    return { mode: 'standard', primary: 'P12', secondary: null, scores, axes };
  }

  // 6. 부 페르소나 — 점수차 ≥ 2일 때만 (그 외엔 동등 처리 → 부 없음)
  const [secondPersona, secondScore] = sorted[1];
  let secondary: PersonaCode | null =
    topScore - secondScore >= TOP_GAP_FOR_SECONDARY ? null : secondPersona;

  // 7. 외부복잡도 A6 ≥ 2 → P15/P16/P18 중 1개를 *부* 페르소나에 강제
  if (axes.a6_complexity >= 2) {
    const forced = pickComplexityPersona(responses);
    if (forced && forced !== topPersona) secondary = forced;
  }

  return { mode: 'standard', primary: topPersona, secondary, scores, axes };
}
