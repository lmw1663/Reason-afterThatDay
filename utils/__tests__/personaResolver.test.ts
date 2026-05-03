import { describe, it, expect } from 'vitest';
import {
  resolvePersona,
  appliesGuard,
  appliesRecommendation,
  strictestLimit,
  longestGate,
  type ResolvedPersona,
} from '@/utils/personaResolver';
import type { PersonaCode } from '@/utils/personaClassifier';

// 매트릭스 §4-2 충돌 케이스 8개 — personaResolver.ts doc 표 그대로 재현.
// 표가 코드와 어긋나면 즉시 실패하도록 *기대 결과를 표 그대로* 인라인.
describe('resolvePersona — 매트릭스 §4-2 충돌 8 케이스', () => {
  const cases: Array<{
    name: string;
    primary: PersonaCode;
    secondary: PersonaCode;
    expected: ResolvedPersona;
  }> = [
    {
      name: '#1 P10 + P05 — R5 일반 (C 조절 + D 의미 → primary 유지)',
      primary: 'P10',
      secondary: 'P05',
      expected: { source: 'primary_with_guard', effective: 'P10', guardOverlay: 'P05' },
    },
    {
      name: '#2 P03 + P11 — R5 일반 (C + C → merged → primary 유지)',
      primary: 'P03',
      secondary: 'P11',
      expected: { source: 'primary_with_guard', effective: 'P03', guardOverlay: 'P11' },
    },
    {
      name: '#3 P01 + P02 — R2 (HARMFUL primary, 부의 금기 overlay)',
      primary: 'P01',
      secondary: 'P02',
      expected: { source: 'primary_with_guard', effective: 'P01', guardOverlay: 'P02' },
    },
    {
      name: '#4 P19 + P03 — R5 일반 (C + C → merged → primary 유지)',
      primary: 'P19',
      secondary: 'P03',
      expected: { source: 'primary_with_guard', effective: 'P19', guardOverlay: 'P03' },
    },
    {
      name: '#5 P12 + P05 — R3 (P12 baseline → 부를 실질로)',
      primary: 'P12',
      secondary: 'P05',
      expected: { source: 'secondary', effective: 'P05', guardOverlay: null },
    },
    {
      name: '#6 P15 + P16 — R4 (외부복잡도 둘 다 → 행정·정서 분리)',
      primary: 'P15',
      secondary: 'P16',
      expected: { source: 'split_complexity', effective: 'P15', guardOverlay: 'P16' },
    },
    {
      name: '#7 P20 + P03 — R2 (HARMFUL + 부의 새벽 트리거 overlay 보존)',
      primary: 'P20',
      secondary: 'P03',
      expected: { source: 'primary_with_guard', effective: 'P20', guardOverlay: 'P03' },
    },
    {
      name: '#8 P04 + P10 — R5 swap (D 의미 + C 조절 → effective 부로 스왑)',
      primary: 'P04',
      secondary: 'P10',
      expected: { source: 'primary_with_guard', effective: 'P10', guardOverlay: 'P04' },
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      expect(resolvePersona(c.primary, c.secondary)).toEqual(c.expected);
    });
  }
});

describe('resolvePersona — 보조 분기', () => {
  it('R0 crisisLockout=true → 페르소나 무시 (effective null)', () => {
    expect(resolvePersona('P10', 'P05', { crisisLockout: true })).toEqual({
      source: 'crisis_override',
      effective: null,
      guardOverlay: null,
    });
  });

  it('primary=null → none (baseline 흐름)', () => {
    expect(resolvePersona(null, 'P05')).toEqual({
      source: 'none',
      effective: null,
      guardOverlay: null,
    });
  });

  it('secondary === primary → 중복 정규화로 secondary 무시', () => {
    expect(resolvePersona('P10', 'P10')).toEqual({
      source: 'primary_only',
      effective: 'P10',
      guardOverlay: null,
    });
  });

  it('R2 HARMFUL이지만 secondary 없음 → primary_only', () => {
    expect(resolvePersona('P01', null)).toEqual({
      source: 'primary_only',
      effective: 'P01',
      guardOverlay: null,
    });
  });

  it('R5 일반에서 secondary 없음 → primary_only', () => {
    expect(resolvePersona('P10', null)).toEqual({
      source: 'primary_only',
      effective: 'P10',
      guardOverlay: null,
    });
  });

  it('R3 P12 단독 (secondary null) → primary_only (P12 baseline)', () => {
    // P12는 HARMFUL 아니므로 R5 fall-through, sec 없음 → primary_only
    expect(resolvePersona('P12', null)).toEqual({
      source: 'primary_only',
      effective: 'P12',
      guardOverlay: null,
    });
  });
});

// 매트릭스 §4-2에 명시되지 않은 *코드 동작 잠금* 케이스. opus 검증(344304c) 후속 권고.
// 향후 매트릭스 §4-2가 보강되면 본 describe를 SSOT 표 검증으로 승격할 것.
describe('resolvePersona — 매트릭스 미명세 케이스 (코드 동작 잠금)', () => {
  it('P12 + P01 — R3 우선이 R2(부 HARMFUL)보다 앞: secondary, effective=P01, overlay=null', () => {
    // P12는 HARMFUL 아니므로 R2 통과 → R3(P12 주 + 부 있음) 진입.
    // 결과적으로 effective=P01에서 권장+금기 모두 적용 (overlay 없어도 effective 자체에서 검사됨).
    expect(resolvePersona('P12', 'P01')).toEqual({
      source: 'secondary',
      effective: 'P01',
      guardOverlay: null,
    });
  });

  it('P15 + P03 — R4 미발동(부가 non-complexity), R5 fall-through: D+C swap', () => {
    // P15(D, complexity) + P03(C, non-complexity) → R4 둘 다 complexity 조건 미충족 → R5.
    // priority(D, C) = 'secondary' → effective=P03, overlay=P15.
    expect(resolvePersona('P15', 'P03')).toEqual({
      source: 'primary_with_guard',
      effective: 'P03',
      guardOverlay: 'P15',
    });
  });
});

describe('appliesGuard — effective + overlay 양쪽 검사 (OR)', () => {
  const resolved: ResolvedPersona = {
    source: 'primary_with_guard',
    effective: 'P20',
    guardOverlay: 'P03',
  };

  it('effective true → true', () => {
    expect(appliesGuard(resolved, (p) => p === 'P20')).toBe(true);
  });

  it('overlay true → true (effective false)', () => {
    expect(appliesGuard(resolved, (p) => p === 'P03')).toBe(true);
  });

  it('양쪽 false → false', () => {
    expect(appliesGuard(resolved, (p) => p === 'P10')).toBe(false);
  });

  it('overlay null이면 effective만 검사', () => {
    const single: ResolvedPersona = {
      source: 'primary_only',
      effective: 'P10',
      guardOverlay: null,
    };
    expect(appliesGuard(single, (p) => p === 'P03')).toBe(false);
    expect(appliesGuard(single, (p) => p === 'P10')).toBe(true);
  });
});

describe('appliesRecommendation — effective만 검사 (R5 부의 권장 차단)', () => {
  const resolved: ResolvedPersona = {
    source: 'primary_with_guard',
    effective: 'P10',
    guardOverlay: 'P14',
  };

  it('effective true → true', () => {
    expect(appliesRecommendation(resolved, (p) => p === 'P10')).toBe(true);
  });

  it('overlay만 true → false (R5: 부의 권장 차단)', () => {
    expect(appliesRecommendation(resolved, (p) => p === 'P14')).toBe(false);
  });
});

describe('strictestLimit — 양쪽 중 더 작은 값 (보수적 cap)', () => {
  const resolved: ResolvedPersona = {
    source: 'primary_with_guard',
    effective: 'P19',
    guardOverlay: 'P03',
  };

  it('effective 7, overlay 10 → 7', () => {
    const limitFn = (p: PersonaCode | null) => (p === 'P19' ? 7 : 10);
    expect(strictestLimit(resolved, limitFn)).toBe(7);
  });

  it('effective 10, overlay 5 → 5 (overlay가 더 엄격)', () => {
    const limitFn = (p: PersonaCode | null) => (p === 'P03' ? 5 : 10);
    expect(strictestLimit(resolved, limitFn)).toBe(5);
  });

  it('overlay null → effective 값 그대로', () => {
    const single: ResolvedPersona = {
      source: 'primary_only',
      effective: 'P19',
      guardOverlay: null,
    };
    expect(strictestLimit(single, () => 7)).toBe(7);
  });
});

describe('longestGate — 양쪽 중 더 큰 값 (보수적 대기)', () => {
  const resolved: ResolvedPersona = {
    source: 'primary_with_guard',
    effective: 'P10',
    guardOverlay: 'P14',
  };

  it('effective 14, overlay 21 → 21 (overlay가 더 긴 대기)', () => {
    const gateFn = (p: PersonaCode | null) => (p === 'P14' ? 21 : 14);
    expect(longestGate(resolved, gateFn)).toBe(21);
  });

  it('effective 30, overlay 14 → 30', () => {
    const gateFn = (p: PersonaCode | null) => (p === 'P10' ? 30 : 14);
    expect(longestGate(resolved, gateFn)).toBe(30);
  });

  it('overlay null → effective 값 그대로', () => {
    const single: ResolvedPersona = {
      source: 'primary_only',
      effective: 'P10',
      guardOverlay: null,
    };
    expect(longestGate(single, () => 14)).toBe(14);
  });
});
