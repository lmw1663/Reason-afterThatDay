import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 페르소나 4유형 분류 — C-2-Ref-1 (참고용.md §1)
 *
 * 페르소나마다 *1차 장애물*이 다르고, 그 장애물을 풀어야 다른 작업이 효과를 낸다.
 * 4유형(A 안전 / B 감정 접촉 / C 감정 조절 / D 의미 재구성)으로 분류해 다중 페르소나 우선순위·
 * 시간선 트랙 활성화·GPT 톤 분기에 활용.
 *
 * SSOT — 분기 로직(personaResolver, GPT prompts, 시간선 트랙)에서 본 매핑만 import.
 */

export type PersonaTypology =
  | 'A_safety'      // 안전 확보 (위기 평가·외부 자원이 1순위)
  | 'B_contact'     // 감정 접촉 (해리·차단을 풀어야 함)
  | 'C_regulation'  // 감정 조절 (충동·반추 폭주를 잡아야 함)
  | 'D_meaning';    // 의미 재구성 (정체성·미래상 재구축)

const TYPOLOGY_MAP: Record<PersonaCode, PersonaTypology> = {
  // 🔴 A 안전 확보 — 위기 평가·외부 자원 우선 (참고용 §1·§2 P14·P20)
  P14: 'A_safety',  // 외도 가해 — 수치심·자기 처벌 → 자해 사고 위험
  P20: 'A_safety',  // 트라우마 본딩 — 학대 노출 가능성

  // 🟠 B 감정 접촉 — 감정 차단·해리 (참고용 §2 P02·P08)
  // 주의: 참고용 §1 표는 P12 일부·P17도 B로 분류. 본 SSOT는 *§2 우선순위 분류*(line 35) 채택.
  // §1 vs §2 충돌 시 §2가 더 명료 + 단일 매핑 원칙 유지 (런타임 재분류 훅은 후속).
  P02: 'B_contact', // 회피형 — "괜찮다" 자동 반응
  P08: 'B_contact', // 장기 권태 — 정체성 상실 미인정

  // 🟡 C 감정 조절 — 감정 압도·반추 폭주 (참고용 §2 P01·P03·P06·P10·P11·P19)
  P01: 'C_regulation', // 자기 판단 손상 — 현실 검증 기준점 회복 우선
  P03: 'C_regulation', // 불안형 — 매달림·반복 연락 충동
  P06: 'C_regulation', // 반복 사이클 — 패턴 인식 + 행동 차단
  P10: 'C_regulation', // 분노 지배 — 표출 통로 우선
  P11: 'C_regulation', // 두려움형 — 양가감정 정상화
  P19: 'C_regulation', // ROCD — 결정하지 않을 권리

  // 🟢 D 의미 재구성 — 정체성·미래상 재구축 (참고용 §2 P04·P05·P07·P09·P12·P15~P18)
  P04: 'D_meaning',  // 갑작스러운 통보 — 사실 정리 → 의미 부여
  P05: 'D_meaning',  // 죄책감 — 결정 회고
  P07: 'D_meaning',  // 첫 이별 — 정상화 교육
  P09: 'D_meaning',  // 헌신 소진 — 자기 욕구 인식
  P12: 'D_meaning',  // 안정형 — baseline. *회피 위장* 검증 시 B로 재분류 (참고용 §3-1 line 319, 후속 훅)
  P15: 'D_meaning',  // 동거 정리 — 행정·감정 분리
  P16: 'D_meaning',  // 결혼·이혼 — 외부 자원 + 자녀 보호
  P17: 'D_meaning',  // 강제 이별 — 통제 불가 수용
  P18: 'D_meaning',  // 사회적 얽힘 — 마주침 예측 가능성
};

/**
 * 페르소나의 4유형 반환. null(분류 미정)이면 null.
 * P13(사별)은 PersonaCode 타입에서 제외됐으므로 본 매핑에 없음.
 */
export function getPersonaTypology(p: PersonaCode | null): PersonaTypology | null {
  if (!p) return null;
  return TYPOLOGY_MAP[p];
}

/** 안전 우선 페르소나 — A 유형은 다른 모든 작업보다 선행 (참고용 §3-1). */
export function isSafetyFirstPersona(p: PersonaCode | null): boolean {
  return getPersonaTypology(p) === 'A_safety';
}
