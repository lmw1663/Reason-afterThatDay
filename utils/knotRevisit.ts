/**
 * 회상 의식 스케줄 — F-9
 *
 * 매듭 신청 시점에 페르소나별로 미래 회상 의식을 예약한다. 매듭 *완료 후* 시점에 발화:
 *   - P05 본인이 끝낸 죄책감: D+30·D+60 재방문 회상
 *   - P14 외도 가해 후회: D+30·D+60 재방문 (자기 용서 D+60 잠금 해제 신호)
 *   - P06 반복 재회 사이클: D+7 사이클 회고 ("이번엔 뭐가 다를까?")
 *
 * 본 모듈은 *순수 함수*. DB INSERT는 api/knotRevisit.ts, 로컬 알림 등록은 호출자 책임.
 *
 * 스펙: docs/psychology-logic/redesign-graduation.md §6, §7 / 매트릭스 §C9
 * 마이그레이션: supabase/migrations/034_revisit_rituals.sql
 */

import type { PersonaCode } from './personaClassifier';

export type RitualType = 'd30_revisit' | 'd60_revisit' | 'd30_cycle_review';

export interface RitualSchedule {
  ritualType: RitualType;
  /** 매듭 *완료* 시점 기준 N일 후 발화 (D+N). */
  daysAfterKnot: number;
  /** 푸시 본문 — 페르소나 라벨 비노출 원칙 준수. */
  pushTitle: string;
  pushBody: string;
}

/**
 * P05 / P14 D+30·60 재방문 회상 의식.
 * "한 달이 지났어. 그때의 결정이 지금도 너에게 가까운 진실이야?"
 */
const REVISIT_D30: RitualSchedule = {
  ritualType: 'd30_revisit',
  daysAfterKnot: 30,
  pushTitle: '한 달이 지났어',
  pushBody: '그때의 결정을 한 번 다시 들여다볼래?',
};

const REVISIT_D60: RitualSchedule = {
  ritualType: 'd60_revisit',
  daysAfterKnot: 60,
  pushTitle: '두 달이 지났어',
  pushBody: '한 번 더 만나볼게. 지금의 너와 그때의 결정.',
};

/**
 * P06 D+7 사이클 회고 ("지난번엔 어땠어?").
 */
const CYCLE_REVIEW_D7: RitualSchedule = {
  ritualType: 'd30_cycle_review',
  daysAfterKnot: 7,
  pushTitle: '한 주가 지났어',
  pushBody: '이번 사이클은 지난번이랑 뭐가 달랐어?',
};

/**
 * 페르소나별 회상 의식 일정 매핑.
 * 다중 페르소나 시 effective + guardOverlay 양쪽의 일정을 *합집합*으로 등록 (중복 ritualType은 한 번만).
 */
const PERSONA_RITUALS: Partial<Record<PersonaCode, readonly RitualSchedule[]>> = {
  P05: [REVISIT_D30, REVISIT_D60],
  P14: [REVISIT_D30, REVISIT_D60],
  P06: [CYCLE_REVIEW_D7],
};

/**
 * 페르소나 배열에서 등록할 회상 의식 일정 반환.
 * 같은 ritualType이 여러 페르소나에서 나오면 중복 제거.
 */
export function getRitualsForPersonas(personas: readonly PersonaCode[]): RitualSchedule[] {
  const seen = new Set<RitualType>();
  const result: RitualSchedule[] = [];
  for (const p of personas) {
    const rituals = PERSONA_RITUALS[p];
    if (!rituals) continue;
    for (const r of rituals) {
      if (seen.has(r.ritualType)) continue;
      seen.add(r.ritualType);
      result.push(r);
    }
  }
  return result;
}

/**
 * coolingEndsAt(매듭 완료 시점) + daysAfterKnot → 실제 발화 ISO 시각.
 */
export function calculateScheduledAt(
  coolingEndsAt: string,
  daysAfterKnot: number,
): string {
  const base = new Date(coolingEndsAt);
  base.setDate(base.getDate() + daysAfterKnot);
  return base.toISOString();
}
