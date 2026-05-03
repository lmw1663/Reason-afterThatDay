import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 페르소나별 일기 질문 가중치·차단 — C-2-G-3b
 *
 * 매트릭스 §2 C3 셀을 코드 데이터로:
 *  - BOOSTER: 페르소나에게 *우선 노출*할 질문 ID에 점수 가산
 *  - BLOCKED: 페르소나에게 *부적절한* 질문 ID 완전 차단
 *
 * useSmartQuestion이 본 데이터를 사용해 풀 필터링·정렬.
 *
 * 라벨 비노출: 본 매핑은 사용자에게 직접 보이지 않음 — 분기 결과만 화면에 반영.
 */

/**
 * 페르소나별 booster — 해당 질문 ID에 점수 가산.
 * 가중치 +20이면 일반 가중치 5~10보다 압도적 우선 노출.
 */
export const PERSONA_QUESTION_BOOSTERS: Partial<Record<PersonaCode, Record<string, number>>> = {
  // P05 결정 후회·죄책감 — 결정 회상 프롬프트 우선
  P05: { j_decision_recall: 20 },
  // P11 두려움형(양가감정) — 두 마음 프롬프트 우선
  P11: { j_two_minds: 20 },
  // P01 자기 판단 손상형 — 사실 기록 프롬프트 우선
  P01: { j_fact_only: 20 },
  // P04 갑작스러운 통보 — 사실 vs 상상 구분 (j_fact_only 재활용)
  P04: { j_fact_only: 15 },
  // P17 강제 이별 — 미완의 말 글쓰기 우선
  P17: { j_unspoken: 20 },
  // P20 트라우마 본딩 — P01과 동일 (사실 기록 우선)
  P20: { j_fact_only: 18 },
  // P14 외도 가해 후회 — 결정 회상 프롬프트 (책임 행동 분해 맥락)
  P14: { j_decision_recall: 15 },
};

/**
 * 페르소나별 *차단* 질문 ID — 후보 풀에서 완전 제외.
 *
 * - P01·P14·P20: *상대 관점/변호 질문*은 자기 판단 손상·자기 정당화·미화 위험
 *   매트릭스 C3·C6 정합. (analysis context 질문이지만 journal에 cross-context 노출 가능)
 * - P09 (헌신 소진): *상대 추측 질문* 차단 — "지금 상대방은 어떤 마음일 것 같아?" 등
 * - P03·P05·P09: 단점 회상·미화 질문은 페르소나별 별도 가드 (G-3b 단계에서 일기 풀에 한정)
 */
// 주의: 차단 ID들이 현재 모두 context: ['analysis']라 journal 화면 필터에서 이미 제외됨.
// 본 차단 룰은 *analysis 화면*에서만 실효. journal에 cross-context 질문 추가 시를 대비한 방어이기도 함.
export const PERSONA_QUESTION_BLOCKED: Partial<Record<PersonaCode, string[]>> = {
  P01: ['a_their_feeling', 'a_fix_possible'],   // 상대 변호·관계 회복 질문 차단
  // P09는 a_fix_possible 차단 안 함 — "주어 *너* 강제"는 *상대 추측*만 막는 의도. 관계 회복 가능성 질문은
  // 헌신 소진형에게도 자기 욕구 회복 단계에서 도움될 수 있음 (단, 후속 임상 검증 필요).
  P09: ['a_their_feeling'],                      // "상대 마음 추측" 차단
  P14: ['a_their_feeling', 'a_fix_possible'],   // 가해자가 상대 마음 추측은 자기 정당화
  P20: ['a_their_feeling', 'a_fix_possible'],   // P01과 동일
};

/**
 * 질문 가중치 booster 적용 헬퍼 — useSmartQuestion에서 호출.
 */
export function getQuestionBooster(persona: PersonaCode | null, questionId: string): number {
  if (!persona) return 0;
  const map = PERSONA_QUESTION_BOOSTERS[persona];
  return map?.[questionId] ?? 0;
}

/**
 * 질문 차단 여부 확인 — useSmartQuestion에서 후보 필터.
 */
export function isQuestionBlocked(persona: PersonaCode | null, questionId: string): boolean {
  if (!persona) return false;
  const blocked = PERSONA_QUESTION_BLOCKED[persona];
  return blocked?.includes(questionId) ?? false;
}
