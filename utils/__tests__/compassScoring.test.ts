// Phase L-1 — 결정 나침반 점수 redesign 회귀 테스트.
// 기존 inline 산식과 동등하면서 stability bonus + confidence 가 정확히 더해지는지.

import { describe, it, expect } from 'vitest';
import {
  computeCompassScore,
  computeDirectionStability,
  computeStabilityBonusMagnitude,
  computeConfidence,
  type CompassQuestion,
} from '@/utils/compassScoring';

const QUESTIONS: ReadonlyArray<CompassQuestion> = [
  { id: 'c_check_past',   catchScore: -1, letGoScore: 1  },
  { id: 'c_check_change', catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_harder', catchScore: 2,  letGoScore: -1 },
  { id: 'c_check_free',   catchScore: -2, letGoScore: 2  },
  { id: 'c_check_fear',   catchScore: 1,  letGoScore: 1  },
];

describe('computeDirectionStability', () => {
  it('빈 배열 → 0', () => {
    expect(computeDirectionStability([])).toBe(0);
  });
  it('전부 같은 방향 → 1', () => {
    expect(computeDirectionStability(['catch', 'catch', 'catch'])).toBe(1);
  });
  it('절반씩 → 0.5', () => {
    expect(computeDirectionStability(['catch', 'let_go', 'catch', 'let_go'])).toBe(0.5);
  });
  it('가장 빈도 높은 방향 비율', () => {
    // catch 3, let_go 1, undecided 1 → 3/5 = 0.6
    expect(computeDirectionStability(['catch', 'catch', 'catch', 'let_go', 'undecided'])).toBeCloseTo(0.6);
  });
});

describe('computeStabilityBonusMagnitude', () => {
  it('0.8 이상 → 3', () => {
    expect(computeStabilityBonusMagnitude(0.8)).toBe(3);
    expect(computeStabilityBonusMagnitude(1)).toBe(3);
  });
  it('0.5 이상 0.8 미만 → 2', () => {
    expect(computeStabilityBonusMagnitude(0.5)).toBe(2);
    expect(computeStabilityBonusMagnitude(0.79)).toBe(2);
  });
  it('0.5 미만 → 1', () => {
    expect(computeStabilityBonusMagnitude(0)).toBe(1);
    expect(computeStabilityBonusMagnitude(0.49)).toBe(1);
  });
});

describe('computeConfidence', () => {
  it('want=catch + score>0 (일치) → 5 + |score|/2 (cap 10)', () => {
    expect(computeConfidence('catch', 0)).toBe(5);  // score=0 일치도 모호 → 중간
    expect(computeConfidence('catch', 4)).toBe(7);  // 5 + round(4/2) = 7
    expect(computeConfidence('catch', 20)).toBe(10); // cap
  });

  it('want=let_go + score=0 → 5 (대칭 — 양방향 동일 신호)', () => {
    expect(computeConfidence('let_go', 0)).toBe(5);
  });
  it('want=let_go + score<0 (일치) → 동일 공식', () => {
    expect(computeConfidence('let_go', -4)).toBe(7);
  });
  it('want=catch + score<0 (불일치) → 5 - |score|/2 (floor 1)', () => {
    expect(computeConfidence('catch', -4)).toBe(3); // 5 - 2 = 3
    expect(computeConfidence('catch', -20)).toBe(1); // floor
  });
  it('want=undecided → 직감 없음, intensity 절반 (cap 5)', () => {
    expect(computeConfidence('undecided', 0)).toBe(1); // floor 1
    expect(computeConfidence('undecided', 4)).toBe(2); // round(4/2)/... actual: round(4/2)=2
    expect(computeConfidence('undecided', 20)).toBe(5); // cap
  });
});

describe('computeCompassScore', () => {
  const baseInput = {
    answers: {
      c_check_past: 'yes',   // catchScore=-1
      c_check_change: 'yes', // catchScore=+2
      c_check_harder: 'yes', // catchScore=+2
      c_check_free: 'no',    // -letGoScore=-2
      c_check_fear: 'yes',   // catchScore=+1
    } as Record<string, 'yes' | 'no'>,
    questions: QUESTIONS,
    want: 'catch' as const,
    recentDirections: ['catch', 'catch', 'catch', 'catch'] as const,
  };

  it('raw score 합산 정확', () => {
    const r = computeCompassScore(baseInput);
    // -1 + 2 + 2 - 2 + 1 = 2
    expect(r.rawScore).toBe(2);
  });

  it('high stability + want=catch → bonus +3', () => {
    const r = computeCompassScore(baseInput); // 4/4 = 1.0 stability
    expect(r.stability).toBe(1);
    expect(r.stabilityBonus).toBe(3);
    expect(r.score).toBe(2 + 3); // raw + bonus
  });

  it('low stability → bonus 약화 (+1)', () => {
    const r = computeCompassScore({
      ...baseInput,
      recentDirections: ['catch', 'let_go', 'undecided', 'catch'], // 2/4 = 0.5 → magnitude 2
    });
    expect(r.stabilityBonus).toBe(2);
  });

  it('recentDirections 비면 stability=0 → bonus 약화 (+1)', () => {
    const r = computeCompassScore({ ...baseInput, recentDirections: [] });
    expect(r.stability).toBe(0);
    expect(r.stabilityBonus).toBe(1);
    expect(r.score).toBe(2 + 1);
  });

  it('want=undecided → bonus 0 (방향 없음)', () => {
    const r = computeCompassScore({
      ...baseInput,
      want: 'undecided',
    });
    expect(r.stabilityBonus).toBe(0);
    expect(r.score).toBe(r.rawScore);
  });

  it('confidence 동시 반환 — want=catch + 양수 점수 → 일치 confidence', () => {
    const r = computeCompassScore(baseInput);
    // score=5 → 5 + round(5/2) = 5+3 = 8
    expect(r.confidence).toBe(8);
  });

  it('want=let_go + raw 양수 + low stability → 불일치 confidence', () => {
    // recentDirections 비우기 — stabilityBonus 약화 → score 양수 유지 → want 와 불일치
    const r = computeCompassScore({ ...baseInput, want: 'let_go', recentDirections: [] });
    // raw=2, magnitude=1, want=let_go → bonus=-1, score = 2 - 1 = 1 (catch 쪽)
    // want=let_go 와 불일치 → 5 - round(1/2) = 4
    expect(r.score).toBe(1);
    expect(r.confidence).toBe(4);
  });

  it('want=catch + raw 양수 + high stability(catch) → 강한 일치 confidence', () => {
    const r = computeCompassScore({ ...baseInput, want: 'catch' });
    // raw=2 + bonus=+3 = 5, want=catch 일치 → 5 + round(5/2) = 5 + 3 = 8
    expect(r.score).toBe(5);
    expect(r.confidence).toBe(8);
  });

  it('빈 answers (전부 미답변) → raw=0', () => {
    const r = computeCompassScore({
      ...baseInput,
      answers: {},
    });
    expect(r.rawScore).toBe(0);
  });
});
