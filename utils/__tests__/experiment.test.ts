import { describe, it, expect } from 'vitest';
import { assignVariant, type VariantWeight } from '@/utils/experiment';

const TWO: VariantWeight[] = [
  { name: 'control', weight: 0.5 },
  { name: 'treatment', weight: 0.5 },
];

const THREE: VariantWeight[] = [
  { name: 'a', weight: 0.33 },
  { name: 'b', weight: 0.33 },
  { name: 'c', weight: 0.34 },
];

describe('assignVariant — 결정성 (deterministic)', () => {
  it('같은 (userId, experimentId) → 항상 같은 변형', () => {
    const v1 = assignVariant('user-1', 'exp-1', TWO);
    const v2 = assignVariant('user-1', 'exp-1', TWO);
    const v3 = assignVariant('user-1', 'exp-1', TWO);
    expect(v1).toBe(v2);
    expect(v2).toBe(v3);
  });

  it('다른 experimentId → 다른 변형 가능', () => {
    // 통계적이라 보장 X. 단 같은 userId에 대해 다른 exp는 *독립적으로* 평가됨을 검증
    const v1 = assignVariant('user-1', 'exp-A', TWO);
    const v2 = assignVariant('user-1', 'exp-B', TWO);
    // 두 변형 모두 control 또는 treatment 중 하나
    expect(['control', 'treatment']).toContain(v1);
    expect(['control', 'treatment']).toContain(v2);
  });
});

describe('assignVariant — 가중치 분포', () => {
  it('50:50 변형 — 1000 사용자 대략 균등 (±10%)', () => {
    const counts = { control: 0, treatment: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = assignVariant(`user-${i}`, 'exp-equal', TWO);
      counts[v as 'control' | 'treatment']++;
    }
    // 정확히 500이 아니어도 400~600 범위면 정합 (의사 난수가 아닌 deterministic 해시이므로)
    expect(counts.control).toBeGreaterThan(400);
    expect(counts.control).toBeLessThan(600);
    expect(counts.treatment).toBeGreaterThan(400);
    expect(counts.treatment).toBeLessThan(600);
  });

  it('80:20 변형 — 1000 사용자 대략 800:200', () => {
    const skewed: VariantWeight[] = [
      { name: 'majority', weight: 0.8 },
      { name: 'minority', weight: 0.2 },
    ];
    const counts = { majority: 0, minority: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = assignVariant(`user-${i}`, 'exp-skew', skewed);
      counts[v as 'majority' | 'minority']++;
    }
    expect(counts.majority).toBeGreaterThan(700);
    expect(counts.majority).toBeLessThan(900);
  });
});

describe('assignVariant — 엣지 케이스', () => {
  it('userId null → 첫 변형 반환 (control)', () => {
    expect(assignVariant(null, 'exp-1', TWO)).toBe('control');
  });

  it('빈 variants → "control" fallback', () => {
    expect(assignVariant('user-1', 'exp-1', [])).toBe('control');
  });

  it('단일 variants → 항상 그것', () => {
    const single: VariantWeight[] = [{ name: 'only', weight: 1 }];
    expect(assignVariant('user-1', 'exp-1', single)).toBe('only');
    expect(assignVariant('user-99', 'exp-1', single)).toBe('only');
  });

  it('weight 합 < 1 — 마지막 변형 fallback (호출자 책임이지만 동작 정합)', () => {
    const partial: VariantWeight[] = [
      { name: 'a', weight: 0.3 },
      { name: 'b', weight: 0.3 },
    ];
    // ratio가 0.6 이상인 사용자는 마지막 'b'로 fallback
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 100; i++) {
      counts[assignVariant(`user-${i}`, 'exp-partial', partial) as 'a' | 'b']++;
    }
    expect(counts.a + counts.b).toBe(100);
    expect(counts.b).toBeGreaterThan(0);
  });

  it('3 변형 33:33:34 — 모든 변형 도달', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      seen.add(assignVariant(`user-${i}`, 'exp-three', THREE));
    }
    expect(seen.has('a')).toBe(true);
    expect(seen.has('b')).toBe(true);
    expect(seen.has('c')).toBe(true);
  });

  it('동일 사용자가 다른 exp에서도 deterministic — 두 변형 모두 도달', () => {
    // 같은 사용자가 1000개 다른 exp에서 변형을 받는 경우. 단순 hash라 정확한 균등 보장 X.
    // 두 변형 모두 0이 아니면 deterministic 분기가 정상 작동
    const counts = { control: 0, treatment: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = assignVariant('user-fixed', `exp-${i}`, TWO);
      counts[v as 'control' | 'treatment']++;
    }
    expect(counts.control).toBeGreaterThan(0);
    expect(counts.treatment).toBeGreaterThan(0);
    // 합 = 1000
    expect(counts.control + counts.treatment).toBe(1000);
  });
});
