import { describe, it, expect } from 'vitest';
import { calculateScheduledAt, getRitualsForPersonas } from '../knotRevisit';

describe('getRitualsForPersonas', () => {
  it('P05 → D+30·D+60 재방문 2건', () => {
    const r = getRitualsForPersonas(['P05']);
    expect(r.map((x) => x.ritualType)).toEqual(['d30_revisit', 'd60_revisit']);
    expect(r[0].daysAfterKnot).toBe(30);
    expect(r[1].daysAfterKnot).toBe(60);
  });

  it('P14 → D+30·D+60 재방문 2건', () => {
    expect(getRitualsForPersonas(['P14']).map((x) => x.ritualType)).toEqual([
      'd30_revisit',
      'd60_revisit',
    ]);
  });

  it('P06 → D+7 사이클 회고 1건', () => {
    const r = getRitualsForPersonas(['P06']);
    expect(r).toHaveLength(1);
    expect(r[0].ritualType).toBe('d30_cycle_review');
    expect(r[0].daysAfterKnot).toBe(7);
  });

  it('P12(baseline) → 회상 의식 없음', () => {
    expect(getRitualsForPersonas(['P12'])).toEqual([]);
  });

  it('P05 + P14 → 중복 제거 (D+30 한 번, D+60 한 번)', () => {
    const r = getRitualsForPersonas(['P05', 'P14']);
    expect(r.map((x) => x.ritualType)).toEqual(['d30_revisit', 'd60_revisit']);
  });

  it('P05 + P06 → 합집합 3건', () => {
    const r = getRitualsForPersonas(['P05', 'P06']);
    expect(r.map((x) => x.ritualType).sort()).toEqual([
      'd30_cycle_review',
      'd30_revisit',
      'd60_revisit',
    ]);
  });

  it('빈 배열 → 빈 결과', () => {
    expect(getRitualsForPersonas([])).toEqual([]);
  });
});

describe('calculateScheduledAt', () => {
  it('coolingEndsAt + 30일', () => {
    const ends = '2026-05-07T00:00:00.000Z';
    expect(calculateScheduledAt(ends, 30)).toBe('2026-06-06T00:00:00.000Z');
  });

  it('coolingEndsAt + 60일', () => {
    const ends = '2026-05-07T00:00:00.000Z';
    expect(calculateScheduledAt(ends, 60)).toBe('2026-07-06T00:00:00.000Z');
  });

  it('coolingEndsAt + 7일', () => {
    const ends = '2026-05-07T12:00:00.000Z';
    expect(calculateScheduledAt(ends, 7)).toBe('2026-05-14T12:00:00.000Z');
  });
});
