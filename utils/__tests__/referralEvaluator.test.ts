import { describe, it, expect } from 'vitest';
import {
  evaluateActiveThresholds,
  isTriggered,
  type UserSafetySnapshot,
} from '@/utils/referralEvaluator';
import { getThresholdById } from '@/utils/referralThresholds';

const empty: UserSafetySnapshot = {
  recentCrisisSeverities: [],
  recentDecisionFlipCount: 0,
  classifiedPersonas: [],
};

describe('isTriggered — 트리거별 발동 조건', () => {
  describe('cssrs_q4_q6_positive (urgent 1회라도)', () => {
    const t = getThresholdById('cssrs_q4_q6_positive')!;

    it('urgent 1건 → true', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['urgent'] })).toBe(true);
    });
    it('urgent 없이 high 다수 → false', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['high', 'high', 'high'] })).toBe(false);
    });
    it('빈 snapshot → false', () => {
      expect(isTriggered(t, empty)).toBe(false);
    });
  });

  describe('cssrs_q1_q3_repeat (caution+ 누적 2회)', () => {
    const t = getThresholdById('cssrs_q1_q3_repeat')!;

    it('caution 1건 → false (1회 미만)', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['caution'] })).toBe(false);
    });
    it('caution 2건 → true', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['caution', 'caution'] })).toBe(true);
    });
    it('high 2건 → true (high도 q2/q3 양성)', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['high', 'high'] })).toBe(true);
    });
    it('urgent 1건 + caution 1건 → true (urgent도 q1~3 포함)', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['urgent', 'caution'] })).toBe(true);
    });
    it('safe만 다수 → false', () => {
      expect(isTriggered(t, { ...empty, recentCrisisSeverities: ['safe', 'safe', 'safe'] })).toBe(false);
    });
  });

  describe('p19_decision_flip_repeat (3회 누적)', () => {
    const t = getThresholdById('p19_decision_flip_repeat')!;

    it('번복 3회 → true', () => {
      expect(isTriggered(t, { ...empty, recentDecisionFlipCount: 3 })).toBe(true);
    });
    it('번복 5회 → true', () => {
      expect(isTriggered(t, { ...empty, recentDecisionFlipCount: 5 })).toBe(true);
    });
    it('번복 2회 → false', () => {
      expect(isTriggered(t, { ...empty, recentDecisionFlipCount: 2 })).toBe(false);
    });
    it('번복 0회 → false', () => {
      expect(isTriggered(t, empty)).toBe(false);
    });
  });

  describe('p20_trauma_bonding_classified (P20 분류 시)', () => {
    const t = getThresholdById('p20_trauma_bonding_classified')!;

    it('P20 단독 → true', () => {
      expect(isTriggered(t, { ...empty, classifiedPersonas: ['P20'] })).toBe(true);
    });
    it('P20 + P10 → true', () => {
      expect(isTriggered(t, { ...empty, classifiedPersonas: ['P10', 'P20'] })).toBe(true);
    });
    it('P10만 → false', () => {
      expect(isTriggered(t, { ...empty, classifiedPersonas: ['P10'] })).toBe(false);
    });
    it('빈 → false', () => {
      expect(isTriggered(t, empty)).toBe(false);
    });
  });

  describe('p01_gaslighting_pattern (P01 분류 시)', () => {
    const t = getThresholdById('p01_gaslighting_pattern')!;

    it('P01 → true', () => {
      expect(isTriggered(t, { ...empty, classifiedPersonas: ['P01'] })).toBe(true);
    });
    it('P14만 → false', () => {
      expect(isTriggered(t, { ...empty, classifiedPersonas: ['P14'] })).toBe(false);
    });
  });

  describe('phq9_severe (≥15)', () => {
    const t = getThresholdById('phq9_severe')!;

    it('14 → false (경계 미만)', () => {
      expect(isTriggered(t, { ...empty, latestPhq9Score: 14 })).toBe(false);
    });
    it('15 → true', () => {
      expect(isTriggered(t, { ...empty, latestPhq9Score: 15 })).toBe(true);
    });
    it('27 → true (최댓값)', () => {
      expect(isTriggered(t, { ...empty, latestPhq9Score: 27 })).toBe(true);
    });
    it('null/미정 → false', () => {
      expect(isTriggered(t, empty)).toBe(false);
      expect(isTriggered(t, { ...empty, latestPhq9Score: null })).toBe(false);
    });
  });

  describe('gad7_severe (≥15)', () => {
    const t = getThresholdById('gad7_severe')!;

    it('14 → false', () => {
      expect(isTriggered(t, { ...empty, latestGad7Score: 14 })).toBe(false);
    });
    it('15 → true', () => {
      expect(isTriggered(t, { ...empty, latestGad7Score: 15 })).toBe(true);
    });
    it('null → false', () => {
      expect(isTriggered(t, empty)).toBe(false);
    });
  });
});

describe('evaluateActiveThresholds — 종합 평가', () => {
  it('빈 snapshot → 발동 0건', () => {
    expect(evaluateActiveThresholds(empty)).toEqual([]);
  });

  it('urgent 1건 → cssrs_q4_q6_positive 발동 (critical)', () => {
    const result = evaluateActiveThresholds({ ...empty, recentCrisisSeverities: ['urgent'] });
    expect(result.length).toBeGreaterThanOrEqual(1);
    const ids = result.map((a) => a.threshold.id);
    expect(ids).toContain('cssrs_q4_q6_positive');
    // urgent도 q1~q3 양성 포함 — repeat 트리거는 1회뿐이라 미발동
    expect(ids).not.toContain('cssrs_q1_q3_repeat');
  });

  it('priority 정렬 — critical이 high·moderate보다 앞', () => {
    const snapshot: UserSafetySnapshot = {
      recentCrisisSeverities: ['urgent', 'caution'], // q4_q6 critical + q1_q3 1회 미만
      recentDecisionFlipCount: 3, // p19 moderate
      classifiedPersonas: ['P20', 'P01'], // p20·p01 high
    };
    const result = evaluateActiveThresholds(snapshot);
    const priorities = result.map((a) => a.threshold.ui_priority);
    // critical → high(들) → moderate 순
    expect(priorities[0]).toBe('critical');
    expect(priorities[priorities.length - 1]).toBe('moderate');
    // 정렬 안정성
    let prev = -1;
    for (const p of priorities) {
      const rank = { critical: 0, high: 1, moderate: 2 }[p];
      expect(rank).toBeGreaterThanOrEqual(prev);
      prev = rank;
    }
  });

  it('cssrs critical 발동 시 externalEmergency=119 + lock_decision_track', () => {
    const result = evaluateActiveThresholds({ ...empty, recentCrisisSeverities: ['urgent'] });
    const cssrs = result.find((a) => a.threshold.id === 'cssrs_q4_q6_positive');
    expect(cssrs?.externalEmergency).toBe('119');
    expect(cssrs?.threshold.lock_decision_track).toBe(true);
  });

  it('ICG/PG-13는 enabled=false → 발동 평가 자체에서 제외 (PHQ/GAD는 D-1~D-6 활성화로 발동 가능)', () => {
    const result = evaluateActiveThresholds({
      recentCrisisSeverities: ['urgent', 'urgent', 'urgent'],
      recentDecisionFlipCount: 10,
      classifiedPersonas: ['P01', 'P20'],
    });
    const ids = result.map((a) => a.threshold.id);
    expect(ids).not.toContain('icg_pg13_chronic_grief');
    // PHQ/GAD는 점수 미정이라 발동 X (정상). enabled=true는 됐지만 latestPhq9/Gad7Score 없음
    expect(ids).not.toContain('phq9_severe');
    expect(ids).not.toContain('gad7_severe');
  });

  it('PHQ-9 score=20 + GAD-7 score=18 → phq9_severe + gad7_severe 발동 (enabled=true)', () => {
    const result = evaluateActiveThresholds({
      ...empty,
      latestPhq9Score: 20,
      latestGad7Score: 18,
    });
    const ids = result.map((a) => a.threshold.id);
    expect(ids).toContain('phq9_severe');
    expect(ids).toContain('gad7_severe');
  });

  it('자원 매핑 — 발동 임계의 resources가 모두 채워져 있음', () => {
    const result = evaluateActiveThresholds({
      ...empty,
      classifiedPersonas: ['P20', 'P01'],
    });
    for (const a of result) {
      expect(a.resources.length).toBeGreaterThan(0);
      expect(a.resources.every((r) => r.id && r.name)).toBe(true);
    }
  });
});

describe('evaluateActiveThresholds — 동시 발동 시나리오', () => {
  it('P20+P01 동시 분류 → 2 high 트리거 발동', () => {
    const result = evaluateActiveThresholds({ ...empty, classifiedPersonas: ['P01', 'P20'] });
    const ids = result.map((a) => a.threshold.id);
    expect(ids).toContain('p01_gaslighting_pattern');
    expect(ids).toContain('p20_trauma_bonding_classified');
    expect(result.length).toBe(2);
  });

  it('cssrs urgent + P19 번복 5회 → critical + moderate 동시 (정렬 검증)', () => {
    const result = evaluateActiveThresholds({
      recentCrisisSeverities: ['urgent'],
      recentDecisionFlipCount: 5,
      classifiedPersonas: [],
    });
    expect(result[0].threshold.ui_priority).toBe('critical');
    expect(result[result.length - 1].threshold.ui_priority).toBe('moderate');
  });
});
