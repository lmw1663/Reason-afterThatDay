import { describe, it, expect } from 'vitest';
import {
  canEnterKnotTrack,
  getKnotPolicy,
  resolveKnotPolicy,
  shouldResetKnotCooldownOnPersonaChange,
} from '../knotPolicy';
import { resolvePersona } from '../personaResolver';

describe('knotPolicy — 단일 페르소나', () => {
  it('P12 baseline → 7일 매듭 trigger 허용', () => {
    expect(getKnotPolicy('P12')).toEqual({
      coolingDays: 7,
      label: '매듭',
      triggerAllowed: true,
      triggerDay: 30,
    });
  });

  it('P20 트라우마 본딩 → 30일 단절 30일 달성', () => {
    expect(getKnotPolicy('P20')).toEqual({
      coolingDays: 30,
      label: '단절 30일 달성',
      triggerAllowed: true,
      triggerDay: 30,
    });
  });

  it('P16 결혼·이혼 → 마무리 라벨 + trigger 차단', () => {
    expect(getKnotPolicy('P16')).toEqual({
      coolingDays: 7,
      label: '마무리',
      triggerAllowed: false,
      triggerDay: 30,
    });
  });

  it('P17 강제 이별 → 마무리 라벨 + trigger 허용', () => {
    expect(getKnotPolicy('P17')).toEqual({
      coolingDays: 7,
      label: '마무리',
      triggerAllowed: true,
      triggerDay: 30,
    });
  });

  it.each([
    ['P03', 14],
    ['P11', 14],
    ['P19', 7],
  ] as const)('비허용 페르소나 %s → triggerAllowed=false', (code, days) => {
    const p = getKnotPolicy(code);
    expect(p.triggerAllowed).toBe(false);
    expect(p.coolingDays).toBe(days);
  });

  it('P06 반복 사이클 → 14일', () => {
    expect(getKnotPolicy('P06').coolingDays).toBe(14);
  });

  it('null(미분류) → baseline (P12 동등)', () => {
    expect(getKnotPolicy(null)).toEqual({
      coolingDays: 7,
      label: '매듭',
      triggerAllowed: true,
      triggerDay: 30,
    });
  });
});

describe('knotPolicy — 다중 페르소나 충돌 해소', () => {
  it('P12 + P03 → 14일(보수적) + trigger 차단(P03 비허용)', () => {
    const resolved = resolvePersona('P12', 'P03');
    const policy = resolveKnotPolicy(resolved);
    expect(policy.coolingDays).toBe(14);
    expect(policy.triggerAllowed).toBe(false);
  });

  it('P20 + P03 → 30일 + trigger 차단', () => {
    const resolved = resolvePersona('P20', 'P03');
    const policy = resolveKnotPolicy(resolved);
    expect(policy.coolingDays).toBe(30);
    expect(policy.label).toBe('단절 30일 달성');
    expect(policy.triggerAllowed).toBe(false);
  });

  it('P10 + P05 → 7일 매듭 trigger 허용 (둘 다 허용)', () => {
    const resolved = resolvePersona('P10', 'P05');
    const policy = resolveKnotPolicy(resolved);
    expect(policy.coolingDays).toBe(7);
    expect(policy.label).toBe('매듭');
    expect(policy.triggerAllowed).toBe(true);
  });

  it('P03 + P11 → 14일 + trigger 차단 (둘 다 비허용)', () => {
    const resolved = resolvePersona('P03', 'P11');
    const policy = resolveKnotPolicy(resolved);
    expect(policy.coolingDays).toBe(14);
    expect(policy.triggerAllowed).toBe(false);
  });

  it('P15 + P16 R4 split_complexity → 마무리 라벨 + trigger 차단(P16)', () => {
    const resolved = resolvePersona('P15', 'P16');
    const policy = resolveKnotPolicy(resolved);
    // effective=P15(매듭), overlay=P16(마무리·비허용)
    expect(policy.label).toBe('매듭'); // effective 우선
    expect(policy.triggerAllowed).toBe(false); // P16 비허용 전파
  });

  it('crisis_override → triggerAllowed=false (lockout)', () => {
    const resolved = resolvePersona('P12', null, { crisisLockout: true });
    const policy = resolveKnotPolicy(resolved);
    expect(policy.triggerAllowed).toBe(false);
  });

  it('R3 P12+P05 secondary → P05 정책 그대로 (P12 baseline 위장 방지)', () => {
    const resolved = resolvePersona('P12', 'P05');
    const policy = resolveKnotPolicy(resolved);
    // effective=P05, guardOverlay=null → 단일 정책
    expect(policy.coolingDays).toBe(7);
    expect(policy.triggerAllowed).toBe(true);
  });
});

describe('knotPolicy — canEnterKnotTrack 단일 진입 가드', () => {
  it('P12 단독 → true', () => {
    expect(canEnterKnotTrack(resolvePersona('P12', null))).toBe(true);
  });
  it('P03 단독 → false (비허용)', () => {
    expect(canEnterKnotTrack(resolvePersona('P03', null))).toBe(false);
  });
  it('P12 + P19 → false (overlay 비허용 전파)', () => {
    expect(canEnterKnotTrack(resolvePersona('P12', 'P19'))).toBe(false);
  });
  it('crisis_override → false', () => {
    expect(canEnterKnotTrack(resolvePersona('P12', null, { crisisLockout: true }))).toBe(false);
  });
});

describe('knotPolicy — 페르소나 이행 시 쿨다운 리셋', () => {
  it('P03(비허용) → P12(허용) 이행 시 true', () => {
    const prev = resolvePersona('P03', null);
    const next = resolvePersona('P12', null);
    expect(shouldResetKnotCooldownOnPersonaChange(prev, next)).toBe(true);
  });

  it('P12(허용) → P12(허용) 동일 시 false', () => {
    const prev = resolvePersona('P12', null);
    const next = resolvePersona('P12', null);
    expect(shouldResetKnotCooldownOnPersonaChange(prev, next)).toBe(false);
  });

  it('P12(허용) → P03(비허용) 이행 시 false (재발화 대상 아님)', () => {
    const prev = resolvePersona('P12', null);
    const next = resolvePersona('P03', null);
    expect(shouldResetKnotCooldownOnPersonaChange(prev, next)).toBe(false);
  });

  it('P12+P03(차단) → P12+P05(허용) 이행 시 true', () => {
    const prev = resolvePersona('P12', 'P03');
    const next = resolvePersona('P12', 'P05');
    expect(shouldResetKnotCooldownOnPersonaChange(prev, next)).toBe(true);
  });
});
