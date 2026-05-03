/**
 * 페르소나 점수 부여 규칙 — C-1-3
 *
 * 단일 진실 소스: docs/psychology-logic/페르소나-분류체계.md §4 점수 부여 규칙 표
 * 변경 시 반드시 양쪽 동기화.
 *
 * 임계 강화 (C-1-1):
 *  - Q2 ① 단독 → P1(+2)  // 이전 +3
 *  - Q2 ① + Q6 동시 → P1(+5, 대체 규칙. 단독 행 무시)
 *  - Q6 단독 → P1(+1)
 *
 * 사별 옵션 제거 (C-1-2): "Q이별 사유 = 사망" 행 없음. 분류 결과에서도 P13 제외.
 *
 * ECR-R 라이선스 미확인 (B-0-1): ECR-R 의존 규칙은 *주석 처리*. 회신 후 활성화.
 */

import type { PersonaCode } from './personaClassifier';

export type RuleKey =
  | 'q1.ghosted'
  | 'q2.too_sensitive' | 'q2.too_sensitive+q6.diverged'
  | 'q2.alone_better' | 'q2.cant_live_without' | 'q2.why_repeat'
  | 'q3.first' | 'q3.same_person_multiple'
  | 'q4.5y_plus' | 'q4.married'
  | 'q5.anger' | 'q5.empty' | 'q5.longing' | 'q5.guilt' | 'q5.unsure'
  | 'q6.diverged'
  | 'q_self_infidelity'
  | 'q_complexity.cohabitation' | 'q_complexity.shared_circle' | 'q_complexity.marriage'
  | 'q_reason.forced';
  // ECR-R 라이선스 회신 후 활성화 예정 키:
  // 'ecrr.avoidance_high' | 'ecrr.anxiety_high' | 'ecrr.both_high'

export const SCORING_RULES: Record<RuleKey, Partial<Record<PersonaCode, number>>> = {
  // Q1
  'q1.ghosted':                 { P04: 3, P11: 1, P20: 1 },

  // Q2 (Q6과의 조합 규칙은 분류기에서 처리 — combo가 양성이면 단독 키는 push 안 됨)
  'q2.too_sensitive':           { P01: 2, P20: 2 },
  'q2.too_sensitive+q6.diverged': { P01: 5, P20: 2 },  // 대체 규칙: P01만 가중, P20은 합쳐서 2
  'q2.alone_better':            { P02: 3, P12: 1 },
  'q2.cant_live_without':       { P03: 3, P09: 1 },
  'q2.why_repeat':              { P06: 3 },

  // Q3
  'q3.first':                   { P07: 3 },
  'q3.same_person_multiple':    { P06: 3, P19: 1, P20: 1 },

  // Q4
  'q4.5y_plus':                 { P08: 2, P16: 2 },
  'q4.married':                 { P16: 3 },

  // Q5
  'q5.anger':                   { P10: 3 },
  'q5.empty':                   { P08: 2 },
  'q5.longing':                 { P03: 2, P09: 1 },
  'q5.guilt':                   { P05: 3, P14: 1 },
  'q5.unsure':                  { P02: 1, P11: 2, P19: 1 },

  // Q6 단독 (Q2 ① 없이) — 가중치 낮음
  'q6.diverged':                { P01: 1, P20: 2 },

  // 본인 외도 — 강제 P14
  'q_self_infidelity':          { P14: 5 },

  // 외부복잡도
  'q_complexity.cohabitation':  { P15: 3, P16: 1 },
  'q_complexity.shared_circle': { P18: 3 },
  'q_complexity.marriage':      { P16: 3 },

  // 이별 사유 (사별 제외)
  'q_reason.forced':            { P17: 3 },
};
